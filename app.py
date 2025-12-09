from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import sys
import subprocess
import time
import datetime
import webbrowser
import json
import requests
import urllib.parse
import re
import platform
import tempfile
from geopy.geocoders import Nominatim
import base64
import io
import markdown
import traceback
from PIL import Image
from dotenv import load_dotenv

# Conditional imports for server compatibility
try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("⚠️ speech_recognition not available on server")

try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    pyttsx3 = None
    TTS_AVAILABLE = False
    print("⚠️ pyttsx3 not available on server")

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    psutil = None
    PSUTIL_AVAILABLE = False
    print("⚠️ psutil not available on server")

# Load environment variables
load_dotenv()
app = Flask(__name__)
CORS(app)
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "message": "Flask app is running",
        "routes": ["/", "/ask", "/voice", "/weather/<city>", "/quick-action/<action>"]
    })
@app.route('/test')
def test():
    return "Test page - Flask is working!"    
    
    
    
# =========== API CONFIGURATION FROM ENVIRONMENT ===========
# These will be loaded from .env file locally, or from Fly.io secrets in production
API_KEY = os.environ.get("API_KEY")
MODEL = "gemini-2.5-flash"

if not API_KEY:
    # Fallback for development only (you can remove this after testing)
    API_KEY = "YOUR_API_KEY_HERE"  # Replace with actual if needed for local dev
    print("⚠️ WARNING: API_KEY not found in environment. Using fallback.")

API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

# --------- NEWS & WEATHER API KEYS ----------
NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")

# =========== REST OF YOUR CODE REMAINS THE SAME ===========
# City coordinates mapping
CITY_COORDINATES = {
    "dhaka": (23.8103, 90.4125),
    "london": (51.5074, -0.1278),
    "new york": (40.7128, -74.0060),
    "tokyo": (35.6762, 139.6503),
    "paris": (48.8566, 2.3522),
    "delhi": (28.7041, 77.1025),
    "mumbai": (19.0760, 72.8777),
    "sydney": (-33.8688, 151.2093),
    "dubai": (25.2048, 55.2708),
    "singapore": (1.3521, 103.8198),
    "naogaon": (24.8, 88.9),
    "rajshahi": (24.3745, 88.6042),
    "chittagong": (22.3569, 91.7832),
    "khulna": (22.8456, 89.5403),
}

# APP PATHS (these won't work on Fly.io - consider removing or modifying)
APP_PATHS = {
    "whatsapp": r"C:\Users\ibnsi\AppData\Local\WhatsApp\WhatsApp.exe",
    "chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "vs code": r"C:\Users\ibnsi\AppData\Local\Programs\Microsoft VS Code\Code.exe",
    "notepad": r"notepad.exe",
    "calculator": r"calc.exe",
    "spotify": r"C:\Users\ibnsi\AppData\Roaming\Spotify\Spotify.exe",
}

# TTS Engine initialization (will only work locally)
# TTS Engine - conditional initialization
engine = None
if TTS_AVAILABLE:
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 170)
        if len(engine.getProperty('voices')) > 1:
            engine.setProperty('voice', engine.getProperty('voices')[1].id)
    except Exception as e:
        engine = None
        print(f"⚠️ Failed to initialize TTS: {e}")
else:
    print("⚠️ TTS not available (pyttsx3 not installed)")
@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    command = data.get('command', '').strip()
    image_base64 = data.get('image', None)
    image_type = data.get('image_type', 'image/jpeg')
    
    # Debug logging
    print(f"\n{'='*50}")
    print(f"Received request - Command: '{command}'")
    print(f"Has image: {image_base64 is not None}")
    print(f"Command length: {len(command)}")
    if image_base64:
        print(f"Image data length: {len(image_base64)}")
    print(f"{'='*50}")
    
    # Handle image analysis
    if image_base64:
        try:
            print("Processing image analysis...")
            # Use Gemini 2.5 Flash for image analysis
            result = analyze_image_with_gemini(command, image_base64, image_type)
            
            if result['success']:
                print(f"Image analysis successful, response length: {len(result['response'])}")
                return jsonify({
                    "response": result['response'],
                    "analysis": result['analysis'],
                    "type": "image"
                })
            else:
                print(f"Image analysis failed: {result['response']}")
                return jsonify({
                    "response": result['response'],
                    "analysis": "",
                    "type": "image"
                })
                
        except Exception as e:
            print(f"Image analysis error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": f"Failed to analyze image: {str(e)}",
                "type": "image"
            })
    
    # Handle text-only commands
    if not command:
        print("No command provided")
        return jsonify({
            "error": "No command provided. Please type something.",
            "type": "text"
        })
    
    print(f"Processing text command: {command}")
    response = perform_task_web(command)
    
    print(f"Response generated, length: {len(response)}")
    print(f"First 200 chars: {response[:200]}...")
    print(f"{'='*50}\n")
    
    return jsonify({
        "response": response,
        "type": "text"
    })
@app.route('/voice', methods=['POST'])
def voice_command():
    """Simple voice command endpoint - now uses the same as text"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No speech text provided"})
    
    text = data.get('text', '').strip()
    
    # Process the command (same as text command)
    response = perform_task_web(text)
    
    return jsonify({
        "text": text,
        "response": response,
        "type": "voice"
    })

@app.route('/weather/<city>', methods=['GET'])
def weather_by_city(city):
    """Get weather for specific city"""
    weather_data = get_weather_by_city(city)
    return jsonify(weather_data)

@app.route('/quick-action/<action>', methods=['POST'])
def quick_action(action):
    actions = {
        'news': get_top_news,
        'weather': lambda: get_weather_by_city("naogaon")["message"],
        'time': get_current_time,
        'joke': tell_joke,
    }
    
    if action in actions:
        response = actions[action]()
        return jsonify({"response": response, "type": "quick_action"})
    
    return jsonify({"error": "Unknown action"})

# =========== AI FUNCTIONS ===========
# =========== AI FUNCTIONS ===========
def ask_ai(prompt: str):
    """Use Gemini for responses (Markdown → HTML)"""

    try:
        print("\n" + "="*60)
        print("ASK_AI CALLED")
        print("Prompt length:", len(prompt))
        print("Preview:", prompt[:200])
        print("="*60)

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                
                "topP": 0.95,
                "topK": 40
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ],
        }

        r = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=180
        )

        print("API status:", r.status_code)

        if r.status_code != 200:
            print("Error body:", r.text[:500])
            return f"API Error {r.status_code}"

        data = r.json()

        # Save raw json
        with open("raw_gemini_response.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Extract content safely
        candidates = data.get("candidates", [])
        if not candidates:
            return "⚠️ Empty response."

        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        if not parts:
            return "⚠️ No content generated."

        reply = parts[0].get("text", "") or ""

        finish = candidates[0].get("finishReason", "OK")
        print("Finish reason:", finish)
        print("Reply length:", len(reply))

        # Save raw text
        with open("raw_reply.txt", "w", encoding="utf-8") as f:
            f.write(reply)

        # Auto-close unfinished code blocks
        reply = fix_code_blocks(reply)

        # Convert Markdown → HTML
        try:
            html = markdown.markdown(
                reply.strip(),
                extensions=[
                    "fenced_code",
                    "codehilite",
                    "tables",
                    "nl2br",
                ]
            )
        except Exception:
            # fallback: plain text
            html = f"<pre>{reply}</pre>"

        return html

    except Exception as e:
        print("Exception:", e)
        traceback.print_exc()
        return f"Error: {e}"
def fix_code_blocks(text: str) -> str:
    # count code blocks
    blocks = text.count("```")
    if blocks % 2 != 0:
        text += "\n```"
    return text

def analyze_image_with_gemini(prompt, image_base64, image_type="image/jpeg"):
    """Analyze image using Gemini 2.5 Flash - SUPPORTS MULTIPLE FORMATS"""
    
    # Validate and normalize image type
    supported_formats = {
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPEG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WEBP',
        'image/bmp': 'BMP'
    }
    
    # Normalize image type
    if image_type in supported_formats:
        mime_type = image_type
    else:
        # Default to JPEG if unknown
        mime_type = 'image/jpeg'
        print(f"Warning: Unknown image type '{image_type}', defaulting to JPEG")
    
    headers = {"Content-Type": "application/json"}
    
    # Prepare content for Gemini
    content = {
        "contents": [{
            "parts": [
                {
                    "inline_data": {
                        "mime_type": mime_type,  # Use correct MIME type
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 4000,
            "topP": 0.95,
            "topK": 40
        }
    }
    
    # Add text prompt
    if prompt:
        content["contents"][0]["parts"].append({
            "text": f"""Analyze this image and provide detailed insights. User request: {prompt}

Please provide:
1. Main subjects and objects in the image
2. Colors, lighting, and composition
3. Context and possible setting
4. Any text, symbols, or logos present
5. Overall interpretation and analysis
6. Technical aspects (quality, format, etc.) if relevant"""
        })
    else:
        content["contents"][0]["parts"].append({
            "text": """Please analyze this image in detail. Provide comprehensive analysis including:
1. Main subjects and objects
2. Colors, lighting, composition
3. Context and possible setting
4. Any text or symbols
5. Overall interpretation
6. Technical observations"""
        })
    
    try:
        print(f"Sending image to Gemini - Type: {mime_type}, Size: {len(image_base64)} bytes")
        
        response = requests.post(API_URL, headers=headers, json=content, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and result['candidates']:
                analysis = result["candidates"][0]["content"]["parts"][0]["text"]
                
                # Format the analysis with image info
                formatted_analysis = format_image_analysis_with_info(analysis, mime_type, len(image_base64))
                
                # Generate response
                if prompt:
                    response_text = f"I've analyzed your image regarding: '{prompt}'"
                else:
                    response_text = f"I've analyzed your {mime_type.split('/')[-1].upper()} image."
                
                return {
                    "response": response_text,
                    "analysis": formatted_analysis,
                    "success": True
                }
        elif response.status_code == 429:
            return {
                "response": "I'm getting too many requests right now. Please try again in a moment.",
                "analysis": "",
                "success": False
            }
        elif response.status_code == 400:
            # Check for specific Gemini errors
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', 'Unknown error')
            print(f"Gemini API error: {error_msg}")
            
            if "image" in error_msg.lower() or "format" in error_msg.lower():
                return {
                    "response": "The image format might not be supported. Please try with JPG, PNG, or WebP format.",
                    "analysis": "",
                    "success": False
                }
            
            return {
                "response": f"API error: {error_msg[:100]}",
                "analysis": "",
                "success": False
            }
        else:
            return {
                "response": f"Image analysis service returned error code {response.status_code}",
                "analysis": "",
                "success": False
            }
            
    except requests.exceptions.Timeout:
        return {
            "response": "Image analysis is taking too long. The image might be too large or complex.",
            "analysis": "",
            "success": False
        }
    except Exception as e:
        print(f"Gemini image analysis error: {str(e)}")
        return {
            "response": f"Sorry, I encountered an error while analyzing the image: {str(e)[:100]}",
            "analysis": "",
            "success": False
        }

def format_image_analysis_with_info(text, image_type, image_size):
    """Format analysis with image information"""
    if not text:
        return ""
    
    # Clean and format the text
   
    
    # Add image info header
    file_size_kb = image_size / 1024
    format_name = image_type.split('/')[-1].upper()
    
    info_html = f"""
    <div class="image-info-card">
        <div class="image-info-header">
            <i class="fas fa-file-image"></i>
            <h4>Image Details</h4>
        </div>
        <div class="image-info-details">
            <div><strong>Format:</strong> {format_name}</div>
            <div><strong>Size:</strong> {file_size_kb:.1f} KB</div>
            <div><strong>Type:</strong> {image_type}</div>
        </div>
    </div>
    """
    
    # Format the analysis text
    lines = text.split('\n')
    formatted_lines = []
    in_list = False
    
    for line in lines:
        line = line.strip()
        if not line:
            if in_list:
                formatted_lines.append('</ul>')
                in_list = False
            continue
            
        # Check for numbered or bullet points
        if line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '- ', '* ', '• ')):
            if not in_list:
                formatted_lines.append('<ul class="analysis-list">')
                in_list = True
            
            # Remove the number/bullet
            if line.startswith(tuple(str(i) + '.' for i in range(1, 10))):
                line = line[line.find('.')+1:].strip()
            else:
                line = line[2:].strip() if len(line) > 2 else line
            
            formatted_lines.append(f'<li>{line}</li>')
        else:
            if in_list:
                formatted_lines.append('</ul>')
                in_list = False
            
            # Check if it's a heading
            if line.endswith(':') and len(line) < 50:
                formatted_lines.append(f'<h4 class="analysis-heading">{line}</h4>')
            else:
                formatted_lines.append(f'<p class="analysis-paragraph">{line}</p>')
    
    if in_list:
        formatted_lines.append('</ul>')
    
    return info_html + '<div class="analysis-content">' + ''.join(formatted_lines) + '</div>'

import html  # Add at top with other imports
import re


def compress_image_if_needed(image_base64, max_size_mb=10):
    """Compress image if it's too large"""
    try:
        # Decode base64
        image_data = base64.b64decode(image_base64)
        
        # Check size
        if len(image_data) <= max_size_mb * 1024 * 1024:
            return image_base64  # No compression needed
        
        # Open image and compress
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Calculate new dimensions (reduce by 50%)
        new_width = img.width // 2
        new_height = img.height // 2
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save compressed image
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        compressed_data = buffer.getvalue()
        
        # Return compressed base64
        return base64.b64encode(compressed_data).decode('utf-8')
        
    except Exception as e:
        print(f"Image compression error: {e}")
        return image_base64  # Return original if compression fails

def get_image_info(image_base64):
    """Get image information"""
    try:
        image_data = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_data))
        
        return {
            'format': img.format,
            'mode': img.mode,
            'size': img.size,
            'width': img.width,
            'height': img.height,
            'megapixels': (img.width * img.height) / 1000000
        }
    except:
        return None

def extract_city_from_query(query):
    """Extract city name from weather query"""
    query_lower = query.lower()
    
    # Check for exact city matches
    for city in CITY_COORDINATES.keys():
        if city in query_lower:
            return city
    
    # Common patterns
    patterns = [
        r"weather (?:in|of|for) ([a-zA-Z\s]+)",
        r"([a-zA-Z\s]+) weather",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, query_lower)
        if match:
            city_name = match.group(1).strip()
            for city in CITY_COORDINATES.keys():
                if city in city_name.lower():
                    return city
    
    return None

def get_weather_by_city(city_name=None):
    """Get weather for specific city or default"""
    if not WEATHER_API_KEY:
        return {"message": "Weather service unavailable.", "data": None}
    
    if city_name and city_name.lower() in CITY_COORDINATES:
        lat, lon = CITY_COORDINATES[city_name.lower()]
        city_display = city_name.title()
    else:
        # Default to Naogaon
        lat, lon = 24.8, 88.9
        city_display = "Naogaon"
        if city_name:
            city_display = city_name.title()
    
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200:
            data = r.json()
            temp = data.get("main", {}).get("temp", "N/A")
            feels_like = data.get("main", {}).get("feels_like", "N/A")
            humidity = data.get("main", {}).get("humidity", "N/A")
            description = data.get("weather", [{}])[0].get("description", "").title()
            icon = data.get("weather", [{}])[0].get("icon", "01d")
            
            weather_data = {
                "city": city_display,
                "temperature": temp,
                "feels_like": feels_like,
                "humidity": humidity,
                "description": description,
                "icon": icon,
                "icon_url": f"https://openweathermap.org/img/wn/{icon}@2x.png"
            }
            
            message = f"In {city_display}: {temp}°C, feels like {feels_like}°C. {description}. Humidity: {humidity}%."
            return {"message": message, "data": weather_data}
        return {"message": "Weather service unavailable.", "data": None}
    except Exception:
        return {"message": "Failed to fetch weather.", "data": None}

def get_top_news():
    """Fetch top news"""
    if not NEWS_API_KEY:
        return "News API key not configured"
    
    url = "https://newsapi.org/v2/top-headlines"
    params = {"country": "us", "pageSize": 5, "apiKey": NEWS_API_KEY}
    
    try:
        r = requests.get(url, params=params, timeout=8)
        if r.status_code == 200:
            articles = r.json().get("articles", [])
            if not articles:
                return "No top headlines found."
            
            news_list = ["<div class='news-container'>"]
            news_list.append("<h3>📰 Top Headlines</h3>")
            
            for i, a in enumerate(articles[:5], 1):
                title = a.get("title", "No title")
                source = a.get("source", {}).get("name", "Unknown")
                url = a.get("url", "#")
                
                news_list.append(f"""
                <div class='news-item'>
                    <span class='news-number'>{i}</span>
                    <div class='news-content'>
                        <strong>{title}</strong>
                        <small>Source: {source}</small>
                    </div>
                </div>
                """)
            
            news_list.append("</div>")
            return "".join(news_list)
        return "Failed to fetch news."
    except Exception:
        return "News service temporarily unavailable."

def get_current_time():
    now = datetime.datetime.now()
    time_str = now.strftime("%I:%M %p")
    date_str = now.strftime("%A, %B %d, %Y")
    
    time_html = f"""
    <div class='time-container'>
        <div class='time-display'>
            <span class='time'>{time_str}</span>
            <span class='date'>{date_str}</span>
        </div>
    </div>
    """
    return time_html

def get_current_date():
    """Get current date only"""
    now = datetime.datetime.now()
    date_str = now.strftime("%A, %B %d, %Y")
    
    date_html = f"""
    <div class='time-container'>
        <div class='time-display'>
            <span class='date'>{date_str}</span>
        </div>
    </div>
    """
    return date_html

def get_current_year():
    """Get current year only"""
    now = datetime.datetime.now()
    year_str = now.strftime("%Y")
    
    year_html = f"""
    <div class='time-container'>
        <div class='time-display'>
            <span class='date'>The current year is <strong>{year_str}</strong></span>
        </div>
    </div>
    """
    return year_html

def tell_joke():
    jokes = [
        "Why did the computer go to therapy? It had too many bytes from its past.",
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "What do you call a computer that sings? A Dell!",
        "Why was the JavaScript developer sad? Because he didn't know how to 'null' his feelings.",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
        "Why do Python developers need glasses? Because they can't C.",
        "What's a programmer's favorite hangout place? Foo Bar.",
        "Why do Java developers wear glasses? Because they don't C#.",
        "What's the object-oriented way to become wealthy? Inheritance.",
        "Why did the developer go broke? Because he used up all his cache."
    ]
    import random
    joke = random.choice(jokes)
    return f"<div class='joke-container'>😂 <strong>Joke:</strong> {joke}</div>"

def open_app_web(name):
    """Open application"""
    name_l = name.lower()
    
    web_apps = {
        "youtube": "https://www.youtube.com",
        "whatsapp": "https://web.whatsapp.com/",
        "telegram": "https://web.telegram.org/",
        "gmail": "https://mail.google.com",
        "facebook": "https://facebook.com",
        "twitter": "https://twitter.com",
        "github": "https://github.com",
        "linkedin": "https://linkedin.com"
    }
    
    if name_l in web_apps:
        webbrowser.open(web_apps[name_l])
        return f"Opening {name.title()} in your browser."
    
    if name_l in APP_PATHS:
        path = APP_PATHS[name_l]
        try:
            os.startfile(path)
            return f"Opening {name}."
        except Exception as e:
            return f"Failed to open {name}: {str(e)}"
    
    return f"Couldn't find '{name}'. Try: YouTube, WhatsApp, Chrome, etc."

# =========== MAIN COMMAND PROCESSOR ===========
# =========== MAIN COMMAND PROCESSOR ===========
def perform_task_web(command):
    """Process user commands with better handling"""
    if not command:
        return "Please provide a command."
    
    orig = command.strip()
    cmd = orig.lower()
    
    # WEATHER WITH CITY DETECTION
    if "weather" in cmd:
        city = extract_city_from_query(cmd)
        if city:
            weather_info = get_weather_by_city(city)
            return weather_info["message"]
        else:
            weather_info = get_weather_by_city()
            return weather_info["message"]
    
    # PERSONAL INFO
    personal_info = {
        "your name": "I am <strong>Ibnsina</strong>, your intelligent assistant! 🤖",
        "time": get_current_time(),
        "date": get_current_date(),
        "year": get_current_year(),
        "birth date": "I was born on <strong>31st December 2000</strong> 🎂",
        "birthday": "I was born on <strong>31st December 2000</strong> 🎂",
        "where.*live": "I live in <strong>Naogaon, Bangladesh</strong> 🇧🇩",
        "father.*name": "My father's name is <strong>Shariful Islam Hera</strong> 👨",
        "mother.*name": "My mother's name is <strong>Wahida Akter Smrity</strong> 👩",
        "religion": "I believe in <strong>Islam</strong> ☪️",
        "joke": tell_joke(),
        "news": get_top_news(),
    }
    
    for pattern, response in personal_info.items():
        if re.search(pattern, cmd):
            return response
    
    # OPEN COMMANDS
    if cmd.startswith("open "):
        app_name = orig[5:].strip()
        return open_app_web(app_name)
    
    # SEARCH COMMANDS
    if "search for" in cmd:
        query = cmd.split("search for", 1)[-1].strip()
        if query:
            webbrowser.open(f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}")
            return f"🔍 Searching Google for: <strong>{query}</strong>"
    
    if "youtube" in cmd and "search" in cmd:
        query = cmd.replace("search youtube for", "").replace("youtube search", "").strip()
        if query:
            webbrowser.open(f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}")
            return f"🎥 Searching YouTube for: <strong>{query}</strong>"
    
    # **IMPROVED CODE REQUEST DETECTION**
    # Only trigger code for specific patterns
    code_triggers = [
        r"code for",
        r"program(?:ming|mer)?\s+for",
        r"write (?:a )?code",
        r"create (?:a )?program",
        r"implement.*(?:function|class|algorithm)",
        r"how to code",
        r"python.*program",
        r"javascript.*script",
        r"html.*page",
        r"css.*style",
        r"algorithm for",
        r"function to",
        r"class for",
        r"script for"
    ]
    
    # **ESSAY/WRITING KEYWORDS (should NOT trigger code)**
    writing_keywords = [
        "essay", "paragraph", "story", "letter", "article", "composition",
        "write about", "describe", "explain", "discuss", "summary",
        "analysis", "review", "report", "paper", "thesis", "dissertation"
    ]
    
    # Check if it's a writing request
    is_writing_request = any(keyword in cmd for keyword in writing_keywords)
    
    # Check if it's a code request
    is_code_request = any(re.search(pattern, cmd) for pattern in code_triggers) and not is_writing_request
    
    if is_code_request:
        print(f"Detected code request: {cmd}")
        prompt = f"""Please provide complete, well-commented code for: {orig}

IMPORTANT: 
1. Provide the FULL code without truncation
2. Include proper error handling
3. Add comments explaining key parts
4. If it's a long program, structure it clearly
5. Use appropriate formatting and indentation

Please ensure the response is complete and not truncated."""
        return ask_ai(prompt)
    
    # FALLBACK TO AI for everything else
    return ask_ai(orig)
def speak_response(text):
    """Generate speech from text"""
    try:
        clean_text = re.sub(r'<[^>]+>', '', text)
        clean_text = re.sub(r'[🤖🎂🇧🇩👨👩☪️🔍🎥😂📰]', '', clean_text)
        
        def speak_thread():
            engine.say(clean_text[:300])
            engine.runAndWait()
        
        Thread(target=speak_thread, daemon=True).start()
    except Exception:
        pass
@app.route('/test-truncation', methods=['GET'])
def test_truncation():
    """Test endpoint to check response truncation"""
    # Test with a known long response
    test_text = "This is a test. " * 500  # 7500 characters
    test_text += "END_OF_TEST"
    
    print(f"Test string length: {len(test_text)}")
    print(f"First 100 chars: {test_text[:100]}")
    print(f"Last 100 chars: {test_text[-100:]}")
    
    return jsonify({
        "length": len(test_text),
        "first_100": test_text[:100],
        "last_100": test_text[-100:],
        "full_text": test_text
    })
if __name__ == '__main__':
    # For production on Fly.io
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

