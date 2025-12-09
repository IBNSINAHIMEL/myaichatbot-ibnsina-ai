// script.js - COMPLETE FIXED VERSION
// DOM Elements
const userInput = document.getElementById('userInput');
const messages = document.getElementById('messages');
const voiceBtn = document.getElementById('voiceBtn');
const themeToggle = document.getElementById('themeToggle');
const weatherInfo = document.getElementById('weatherInfo');
const recentCommands = document.getElementById('recentCommands');
const profileModal = document.getElementById('profileModal');
const imageUpload = document.getElementById('chatImageUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const previewImage = document.getElementById('previewImage');
const sendBtn = document.getElementById('sendBtn');

// Drawer Elements
const leftDrawerBtn = document.getElementById('leftDrawerBtn');
const rightDrawerBtn = document.getElementById('rightDrawerBtn');
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');
const drawerOverlay = document.getElementById('drawerOverlay');
const leftDrawerClose = document.getElementById('leftDrawerClose');
const rightDrawerClose = document.getElementById('rightDrawerClose');

// Quick Action Buttons
const quickNews = document.getElementById('quickNews');
const quickWeather = document.getElementById('quickWeather');
const quickTime = document.getElementById('quickTime');
const quickJoke = document.getElementById('quickJoke');

// Other Buttons
const userAvatar = document.getElementById('userAvatar');
const removeImageBtn = document.getElementById('removeImageBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const profileLinkBtn = document.getElementById('profileLinkBtn');
const profileModalClose = document.getElementById('profileModalClose');

// State
let messageCount = 0;
let commandCount = 0;
let startTime = Date.now();
let selectedImage = null;
let selectedImageBase64 = null;

// ===== INITIALIZATION =====
function initializeApp() {
    console.log('Initializing Ibnsina AI...');
    
    initTheme();
    loadWeather();
    updateStats();
    initDrawers();
    initMobileThemeToggle();
    attachEventListeners();
    
    // Initialize Highlight.js
    if (typeof hljs !== 'undefined') {
        hljs.configure({
            languages: ['python', 'javascript', 'html', 'css', 'json', 'bash', 'java', 'cpp', 'c', 'php', 'ruby']
        });
        console.log('Highlight.js initialized');
    } else {
        console.warn('Highlight.js not loaded');
    }
    
    // Set initial focus
    userInput.focus();
    
    // Force a reflow to fix any rendering issues
    setTimeout(() => {
        if (window.innerWidth <= 768) {
            console.log('Mobile device detected - drawer mode enabled');
        }
    }, 100);
}
// ===== THEME FUNCTIONS =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let isDarkMode = false;
    
    if (savedTheme) {
        isDarkMode = savedTheme === 'dark';
    } else {
        isDarkMode = prefersDark;
    }
    
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    updateThemeToggleUI(isDarkMode);
}

function updateThemeToggleUI(isDarkMode) {
    // Update desktop theme toggle
    if (themeToggle) {
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        
        if (moonIcon && sunIcon) {
            if (isDarkMode) {
                moonIcon.style.opacity = '0';
                sunIcon.style.opacity = '1';
            } else {
                moonIcon.style.opacity = '1';
                sunIcon.style.opacity = '0';
            }
        }
    }
    
    // Update mobile theme toggle
    updateMobileThemeToggleUI(isDarkMode);
}

// Theme Toggle Event
function setupThemeToggle() {
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggleUI(newTheme === 'dark');
        });
    }
}

// ===== MOBILE THEME TOGGLE =====
function initMobileThemeToggle() {
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggleUI(newTheme === 'dark');
        });
        
        // Initialize mobile theme toggle UI
        const currentTheme = document.documentElement.getAttribute('data-theme');
        updateMobileThemeToggleUI(currentTheme === 'dark');
    }
}

function updateMobileThemeToggleUI(isDarkMode) {
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    if (!mobileThemeToggle) return;
    
    const moonIcon = mobileThemeToggle.querySelector('.fa-moon');
    const sunIcon = mobileThemeToggle.querySelector('.fa-sun');
    
    if (moonIcon && sunIcon) {
        if (isDarkMode) {
            moonIcon.style.opacity = '0';
            sunIcon.style.opacity = '1';
        } else {
            moonIcon.style.opacity = '1';
            sunIcon.style.opacity = '0';
        }
    }
}

// ===== DRAWER FUNCTIONS =====
function initDrawers() {
    console.log('Initializing drawers...');
    
    // Open/Close Drawers
    if (leftDrawerBtn) {
        leftDrawerBtn.addEventListener('click', openLeftDrawer);
    }
    
    if (rightDrawerBtn) {
        rightDrawerBtn.addEventListener('click', openRightDrawer);
    }
    
    if (leftDrawerClose) {
        leftDrawerClose.addEventListener('click', closeLeftDrawer);
    }
    
    if (rightDrawerClose) {
        rightDrawerClose.addEventListener('click', closeRightDrawer);
    }
    
    // Close drawer when clicking overlay
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeAllDrawers);
    }
    
    // Close drawer with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllDrawers();
        }
    });
    
    // Close drawer when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (leftSidebar && leftSidebar.classList.contains('active') && 
                !leftSidebar.contains(e.target) && 
                e.target !== leftDrawerBtn) {
                closeLeftDrawer();
            }
            
            if (rightSidebar && rightSidebar.classList.contains('active') && 
                !rightSidebar.contains(e.target) && 
                e.target !== rightDrawerBtn) {
                closeRightDrawer();
            }
        }
    });
}

function openLeftDrawer() {
    console.log('Opening left drawer');
    if (leftSidebar) {
        leftSidebar.classList.add('active');
    }
    if (drawerOverlay) {
        drawerOverlay.classList.add('active');
    }
    document.body.classList.add('drawer-open');
}

function closeLeftDrawer() {
    console.log('Closing left drawer');
    if (leftSidebar) {
        leftSidebar.classList.remove('active');
    }
    if (drawerOverlay) {
        drawerOverlay.classList.remove('active');
    }
    document.body.classList.remove('drawer-open');
}

function openRightDrawer() {
    console.log('Opening right drawer');
    if (rightSidebar) {
        rightSidebar.classList.add('active');
    }
    if (drawerOverlay) {
        drawerOverlay.classList.add('active');
    }
    document.body.classList.add('drawer-open');
}

function closeRightDrawer() {
    console.log('Closing right drawer');
    if (rightSidebar) {
        rightSidebar.classList.remove('active');
    }
    if (drawerOverlay) {
        drawerOverlay.classList.remove('active');
    }
    document.body.classList.remove('drawer-open');
}

function closeAllDrawers() {
    closeLeftDrawer();
    closeRightDrawer();
}
function processMessageText(text, isUser) {
    if (isUser) {
        // Escape HTML for user messages
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // DEBUG: Check what we're receiving
    console.log('=== processMessageText DEBUG ===');
    console.log('Input length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Last 500 chars:', text.substring(text.length - 500));
    console.log('Has <pre> tags:', text.includes('<pre>'));
    console.log('Has <p> tags:', text.includes('<p>'));
    console.log('Has <code> tags:', text.includes('<code>'));
    console.log('====================');
    
    // If text already has HTML tags from Flask, return as-is
    // Check for common HTML tags that Flask would add
    const hasHtmlTags = text.includes('<') && text.includes('>') && 
                       (text.includes('<pre>') || text.includes('<p>') || 
                        text.includes('<strong>') || text.includes('<em>') || 
                        text.includes('<code>') || text.includes('<ul>') || 
                        text.includes('<li>'));
    
    if (hasHtmlTags) {
        console.log('Detected HTML from Flask, returning as-is');
        return text;
    }
    
    // If no HTML detected, add basic formatting
    console.log('No HTML detected, adding basic formatting');
    
    // Simple markdown to HTML conversion
    let processed = text;
    
    // Code blocks
    processed = processed.replace(/```(\w+)?\s*\n([\s\S]*?)\n```/g, 
        '<pre><code>$2</code></pre>');
    
    // Inline code
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold and italic
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks (simple approach)
    processed = processed.replace(/\n\n/g, '</p><p>');
    processed = processed.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if needed
    if (!processed.startsWith('<') || processed.startsWith('<br')) {
        processed = '<p>' + processed + '</p>';
    }
    
    return processed;
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCodeBlocks(messageBody) {
    const codeBlocks = messageBody.querySelectorAll('pre code');
    
    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;
        
        // Clean up any existing broken highlighting
        codeBlock.innerHTML = codeBlock.textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        copyBtn.title = 'Copy code';
        
        copyBtn.onclick = async function() {
            const code = codeBlock.textContent;
            try {
                await navigator.clipboard.writeText(code);
                showToast('Code copied to clipboard!', 'success');
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.style.color = '#10b981';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="far fa-copy"></i>';
                    this.style.color = '';
                }, 2000);
            } catch (err) {
                showToast('Failed to copy code', 'error');
                this.innerHTML = '<i class="fas fa-times"></i>';
                this.style.color = '#ef4444';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="far fa-copy"></i>';
                    this.style.color = '';
                }, 2000);
            }
        };
        
        pre.appendChild(copyBtn);
        
        // Use Highlight.js to detect language and highlight
        hljs.highlightElement(codeBlock);
        
        // Get the language that Highlight.js detected
        const language = codeBlock.className
            .split(' ')
            .find(cls => cls.startsWith('language-') || cls.startsWith('hljs-language-'));
        
        let detectedLanguage = 'code';
        if (language) {
            detectedLanguage = language.replace('language-', '').replace('hljs-language-', '');
        } else {
            // Fallback detection
            const text = codeBlock.textContent;
            if (text.includes('def ') || text.includes('import ') || text.includes('print(')) {
                detectedLanguage = 'python';
            } else if (text.includes('function ') || text.includes('const ') || text.includes('let ')) {
                detectedLanguage = 'javascript';
            } else if (text.includes('<') && text.includes('>')) {
                detectedLanguage = 'html';
            } else if (text.includes('{') && text.includes('}') && text.includes(':')) {
                detectedLanguage = 'css';
            }
        }
        
        // Add language tag
        if (detectedLanguage && detectedLanguage !== 'plaintext') {
            const langTag = document.createElement('span');
            langTag.className = 'code-language';
            langTag.textContent = detectedLanguage;
            pre.appendChild(langTag);
        }
    });
}


function addExpandableFeature(messageBody) {
    const totalHeight = messageBody.scrollHeight;
    const containerHeight = 800; // INCREASED from 400 to 800
    
    // Only add expandable if it's REALLY long (more than 1200px)
    if (totalHeight > 1200) {
        messageBody.classList.add('expandable');
        messageBody.style.maxHeight = containerHeight + 'px';
        
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-toggle-btn';
        expandBtn.innerHTML = 'Show more <i class="fas fa-chevron-down"></i>';
        
        expandBtn.onclick = function() {
            if (messageBody.classList.contains('expanded')) {
                messageBody.classList.remove('expanded');
                messageBody.style.maxHeight = containerHeight + 'px';
                this.innerHTML = 'Show more <i class="fas fa-chevron-down"></i>';
            } else {
                messageBody.classList.add('expanded');
                messageBody.style.maxHeight = 'none';
                this.innerHTML = 'Show less <i class="fas fa-chevron-up"></i>';
                
                // Scroll to show the newly expanded content
                setTimeout(() => {
                    messages.scrollTop = messages.scrollHeight;
                }, 100);
            }
        };
        
        messageBody.appendChild(expandBtn);
    }
}


// ===== CHAT FUNCTIONS =====
async function sendMessage() {
    if (window.innerWidth <= 768) {
        closeAllDrawers();
    }
    
    const text = userInput.value.trim();
    const hasImage = selectedImage !== null;
    
    if (!text && !hasImage) {
        showToast('Please type a message or upload an image', 'error');
        return;
    }
    
    // Clear input
    userInput.value = '';
    
    // Add to recent commands
    if (text) {
        addRecentCommand(text);
        commandCount++;
    }
    
    // Show image immediately in chat
    if (hasImage) {
        addImageMessage(selectedImageBase64, text || 'Analyze this image');
    } else {
        addMessage(text, true);
    }
    
    // Show thinking message
    const thinkingId = showThinkingMessage();
    
    try {
        // Prepare request data
        const requestData = {
            command: text || '',
            type: hasImage ? 'image' : 'text'
        };
        
        if (hasImage) {
            // IMPROVED: Better regex to handle various image MIME types
            const base64Regex = /^data:image\/(\w+);base64,/;
            const matches = selectedImageBase64.match(base64Regex);
            
            if (matches) {
                const mimeType = matches[1];
                // Extract base64 data (everything after the comma)
                const base64Data = selectedImageBase64.split(',')[1];
                requestData.image = base64Data;
                requestData.image_type = `image/${mimeType}`;
                console.log(`Detected image type: image/${mimeType}`);
            } else {
                // Fallback
                const base64Data = selectedImageBase64.replace(/^data:[^,]+,/, '');
                requestData.image = base64Data;
                requestData.image_type = 'image/jpeg';
                console.warn('Could not extract MIME type, defaulting to JPEG');
            }
        }
        
        console.log('Sending request:', { 
            hasImage, 
            commandLength: requestData.command.length,
            imageSize: hasImage ? requestData.image.length : 0,
            timestamp: new Date().toISOString()
        });
        
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('=== RESPONSE RECEIVED ===');
        console.log('Response type:', data.type);
        console.log('Has error:', !!data.error);
        
        // DEBUG: Check for truncation
        if (data.response && typeof data.response === 'string') {
            console.log('Response length:', data.response.length);
            
            // Check for truncation indicators
            const last100Chars = data.response.slice(-100);
            console.log('Last 100 chars:', last100Chars);
            
            // Check if code blocks are properly closed
            const openPreTags = (data.response.match(/<pre>/g) || []).length;
            const closePreTags = (data.response.match(/<\/pre>/g) || []).length;
            const openCodeTags = (data.response.match(/<code>/g) || []).length;
            const closeCodeTags = (data.response.match(/<\/code>/g) || []).length;
            
            console.log('HTML tag balance:', {
                '<pre>': openPreTags,
                '</pre>': closePreTags,
                '<code>': openCodeTags,
                '</code>': closeCodeTags
            });
            
            if (openPreTags !== closePreTags || openCodeTags !== closeCodeTags) {
                console.warn('⚠️ Unbalanced HTML tags detected - response might be truncated!');
                showToast('Warning: Response might be incomplete. Try asking again.', 'warning');
            }
            
            // Check for common truncation patterns
            const truncationPatterns = [
                /\.\.\.\s*$/,
                /…\s*$/,
                /<[^>]+>\s*$/,  // Ends with an opening tag
                /```\s*$/,
                /\*\*\s*$/,
                /```[a-z]*\n[^`]*$/  // Unclosed code block
            ];
            
            for (const pattern of truncationPatterns) {
                if (pattern.test(data.response)) {
                    console.warn(`⚠️ Truncation pattern detected: ${pattern}`);
                    break;
                }
            }
        }
        
        // Remove thinking message
        removeThinkingMessage(thinkingId);
        
        if (data.error) {
            addMessage(`❌ Error: ${data.error}`, false);
        } else {
            // Handle image analysis response
            if (hasImage) {
                addImageAnalysisResponse(data.response, data.analysis || '');
            } else {
                addMessage(data.response, false);
            }
            
            // Update weather if needed
            if (text.toLowerCase().includes('weather')) {
                loadWeather();
            }
        }
    } catch (error) {
        removeThinkingMessage(thinkingId);
        addMessage('⚠️ Sorry, I encountered an error. Please try again.', false);
        console.error('Error:', error);
        
        // Show detailed error in console
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.error('Network error - check if server is running on port 5000');
        }
        
        // Save error to localStorage for debugging
        try {
            const errorKey = `error_${Date.now()}`;
            localStorage.setItem(errorKey, JSON.stringify({
                command: text,
                error: error.message,
                timestamp: new Date().toISOString(),
                hasImage: hasImage
            }));
        } catch (e) {
            console.warn('Could not save error data:', e);
        }
    } finally {
        // Clear image selection
        removeImage();
        updateStats();
    }
}
// Add this to your global functions
function debugLastResponse() {
    // Get all debug keys from localStorage
    const debugKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('debug_response_') || key.startsWith('error_')) {
            debugKeys.push(key);
        }
    }
    
    // Sort by timestamp (newest first)
    debugKeys.sort((a, b) => {
        const aTime = parseInt(a.split('_').pop());
        const bTime = parseInt(b.split('_').pop());
        return bTime - aTime;
    });
    
    // Show the latest debug info
    if (debugKeys.length > 0) {
        const latestKey = debugKeys[0];
        const debugData = JSON.parse(localStorage.getItem(latestKey));
        console.log('=== LATEST DEBUG INFO ===');
        console.log('Key:', latestKey);
        console.log('Data:', debugData);
        
        // Show in a toast
        showToast(`Latest response: ${debugData.responseLength || 'N/A'} chars`, 'info');
        
        return debugData;
    } else {
        console.log('No debug data found');
        showToast('No debug data available', 'info');
        return null;
    }
}

// Make it available globally
window.debugLastResponse = debugLastResponse;
function showThinkingMessage() {
    const thinkingId = 'thinking-' + Date.now();
    
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai thinking';
    thinkingDiv.id = thinkingId;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const name = document.createElement('strong');
    name.textContent = 'Ibnsina AI';
    
    header.appendChild(name);
    
    const body = document.createElement('div');
    body.className = 'message-body';
    body.innerHTML = '<div class="thinking-indicator"><span>.</span><span>.</span><span>.</span></div>';
    
    content.appendChild(header);
    content.appendChild(body);
    
    thinkingDiv.appendChild(avatar);
    thinkingDiv.appendChild(content);
    
    messages.appendChild(thinkingDiv);
    messages.scrollTop = messages.scrollHeight;
    
    return thinkingId;
}

function removeThinkingMessage(id) {
    const thinkingElement = document.getElementById(id);
    if (thinkingElement) {
        thinkingElement.remove();
    }
}

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = `<i class="fas fa-${isUser ? 'user' : 'robot'}"></i>`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const name = document.createElement('strong');
    name.textContent = isUser ? 'You' : 'Ibnsina AI';
    
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Add copy button only for AI messages
    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        copyBtn.title = 'Copy message';
        copyBtn.onclick = function() {
            copyMessage(this);
        };
        
        header.appendChild(name);
        header.appendChild(time);
        header.appendChild(copyBtn);
    } else {
        header.appendChild(name);
        header.appendChild(time);
    }
    
    const body = document.createElement('div');
    body.className = 'message-body';
    
    // DEBUG: Log what we're receiving
    console.log('=== addMessage DEBUG ===');
    console.log('Input text length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    console.log('Last 200 chars:', text.substring(text.length - 200));
    console.log('Contains <pre> tags:', text.includes('<pre>'));
    console.log('Contains <code> tags:', text.includes('<code>'));
    
    // Sanitize and process the text
    const processedText = processMessageText(text, isUser);
    console.log('Processed text length:', processedText.length);
    
    body.innerHTML = processedText;
    
    content.appendChild(header);
    content.appendChild(body);
    
    if (isUser) {
        messageDiv.appendChild(content);
        messageDiv.appendChild(avatar);
    } else {
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
    }
    
    messages.appendChild(messageDiv);
    
    // Apply special formatting for AI messages
    if (!isUser) {
        setTimeout(() => {
            console.log('=== Applying post-processing ===');
            console.log('Body HTML length:', body.innerHTML.length);
            console.log('Body text length:', body.textContent.length);
            
            // Count code blocks
            const codeBlocks = body.querySelectorAll('pre');
            console.log('Number of <pre> tags:', codeBlocks.length);
            
            // Check for nested code blocks
            codeBlocks.forEach((pre, i) => {
                const nestedPre = pre.querySelector('pre');
                if (nestedPre) {
                    console.warn(`⚠️ Code block ${i + 1} has nested <pre> tag!`);
                }
            });
            
            // Format code blocks
            formatCodeBlocks(body);
            
            // Add expand/collapse for long content
            addExpandableFeature(body);
            
            // Add syntax highlighting
            applySyntaxHighlighting(body);
            
            console.log('=== End post-processing ===');
        }, 100);
    }
    
    messages.scrollTop = messages.scrollHeight;
    
    messageCount++;
    updateStats();
}
// Copy message text to clipboard
function copyMessage(button) {
    const messageContent = button.closest('.message-content');
    const messageBody = messageContent.querySelector('.message-body');
    
    let textToCopy = '';
    const codeElements = messageBody.querySelectorAll('pre code, code');
    if (codeElements.length > 0) {
        codeElements.forEach(code => {
            textToCopy += code.textContent + '\n';
        });
    } else {
        textToCopy = messageBody.textContent;
    }
    
    textToCopy = textToCopy.trim();
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showCopyFeedback(button, true);
            })
            .catch(err => {
                console.error('Clipboard API failed:', err);
                fallbackCopy(textToCopy, button);
            });
    } else {
        fallbackCopy(textToCopy, button);
    }
}

function fallbackCopy(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        showCopyFeedback(button, successful);
    } catch (err) {
        console.error('Copy failed:', err);
        showCopyFeedback(button, false);
    }
    
    document.body.removeChild(textarea);
}

function showCopyFeedback(button, success) {
    const originalIcon = button.innerHTML;
    
    if (success) {
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#10b981';
        button.title = 'Copied!';
        showToast('Message copied to clipboard!', 'success');
    } else {
        button.innerHTML = '<i class="fas fa-times"></i>';
        button.style.color = '#ef4444';
        button.title = 'Copy failed';
        showToast('Failed to copy message', 'error');
    }
    
    setTimeout(() => {
        button.innerHTML = originalIcon;
        button.style.color = '';
        button.title = 'Copy message';
    }, 2000);
}

// Toast notification function
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ===== QUICK ACTIONS =====
async function quickAction(action) {
    if (window.innerWidth <= 768) {
        closeAllDrawers();
    }
    
    addMessage(`Running ${action}...`, true);
    
    try {
        const response = await fetch(`/quick-action/${action}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.error) {
            addMessage(`❌ Error: ${data.error}`, false);
        } else {
            addMessage(data.response, false);
            
            if (action === 'weather') {
                loadWeather();
            }
        }
    } catch (error) {
        addMessage('⚠️ Action failed. Please try again.', false);
    }
}

// ===== WEATHER FUNCTIONS =====
async function loadWeather() {
    try {
        const response = await fetch('/weather/naogaon');
        const data = await response.json();
        
        if (data.data) {
            const weather = data.data;
            weatherInfo.innerHTML = `
                <div class="weather-icon">
                    <i class="fas fa-${getWeatherIcon(weather.icon)}"></i>
                </div>
                <div class="weather-temp">${Math.round(weather.temperature)}°C</div>
                <div class="weather-desc">${weather.description}</div>
                <div class="weather-details">
                    <div>Feels like: ${Math.round(weather.feels_like)}°C</div>
                    <div>Humidity: ${weather.humidity}%</div>
                    <div>Location: ${weather.city}</div>
                </div>
            `;
        } else if (data.message) {
            weatherInfo.innerHTML = `<div class="weather-error">${data.message}</div>`;
        }
    } catch (error) {
        console.error('Weather load error:', error);
        weatherInfo.innerHTML = '<div class="weather-error">Failed to load weather</div>';
    }
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'sun',
        '01n': 'moon',
        '02d': 'cloud-sun',
        '02n': 'cloud-moon',
        '03d': 'cloud',
        '03n': 'cloud',
        '04d': 'cloud',
        '04n': 'cloud',
        '09d': 'cloud-rain',
        '09n': 'cloud-rain',
        '10d': 'cloud-sun-rain',
        '10n': 'cloud-moon-rain',
        '11d': 'bolt',
        '11n': 'bolt',
        '13d': 'snowflake',
        '13n': 'snowflake',
        '50d': 'smog',
        '50n': 'smog'
    };
    return iconMap[iconCode] || 'cloud';
}

// ===== VOICE FUNCTIONS =====
async function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        showToast('Voice commands work best in Chrome or Edge browser. Please type your message instead.', 'error');
        return;
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    const icon = voiceBtn.querySelector('i');
    
    voiceBtn.classList.add('recording');
    icon.className = 'fas fa-circle';
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        console.log('Listening...');
    };
    
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('You said:', transcript);
        
        addMessage(transcript, true);
        await processVoiceCommand(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        
        if (event.error === 'not-allowed') {
            addMessage('⚠️ Please allow microphone access for voice commands.', false);
        } else if (event.error === 'no-speech') {
            addMessage('⚠️ No speech detected. Please try again.', false);
        } else {
            addMessage(`⚠️ Speech recognition error: ${event.error}`, false);
        }
    };
    
    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
        icon.className = 'fas fa-microphone';
    };
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        voiceBtn.classList.remove('recording');
        icon.className = 'fas fa-microphone';
        addMessage('⚠️ Failed to start voice recognition.', false);
    }
}

async function processVoiceCommand(transcript) {
    const thinkingId = showThinkingMessage();
    
    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: transcript })
        });
        
        const data = await response.json();
        removeThinkingMessage(thinkingId);
        
        if (data.error) {
            addMessage(`❌ Error: ${data.error}`, false);
        } else {
            addMessage(data.response, false);
            
            if (transcript.toLowerCase().includes('weather')) {
                loadWeather();
            }
        }
    } catch (error) {
        removeThinkingMessage(thinkingId);
        addMessage('⚠️ Network error. Please try again.', false);
    }
}

// ===== PROFILE FUNCTIONS =====
function openProfileModal() {
    const modalBody = profileModal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <img src="{{ url_for('static', filename='images/my-photo.jpg') }}" 
                 alt="Profile" 
                 style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary-color); margin-bottom: 20px;">
            
            <h2 style="margin-bottom: 10px; color: var(--text-primary);">Ibnsina</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">AI Assistant Creator & Developer</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 10px;">
                    <i class="fas fa-birthday-cake" style="color: var(--primary-color); margin-right: 10px;"></i>
                    <strong>Birthday:</strong><br>31st Dec 2000
                </div>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 10px;">
                    <i class="fas fa-map-marker-alt" style="color: var(--primary-color); margin-right: 10px;"></i>
                    <strong>Location:</strong><br>Naogaon, Bangladesh
                </div>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 10px;">
                    <i class="fas fa-code" style="color: var(--primary-color); margin-right: 10px;"></i>
                    <strong>Skills:</strong><br>Python, AI, Web Dev
                </div>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 10px;">
                    <i class="fas fa-heart" style="color: var(--primary-color); margin-right: 10px;"></i>
                    <strong>Interests:</strong><br>AI Research
                </div>
            </div>
            
            <button class="btn-secondary" onclick="closeProfileModal()" style="padding: 10px 20px;">Close Profile</button>
        </div>
    `;
    
    profileModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    profileModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ===== IMAGE UPLOAD FUNCTIONS =====
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPG, PNG, GIF, WEBP, BMP)', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image size should be less than 10MB for analysis', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        selectedImageBase64 = e.target.result;
        selectedImage = file;
        
        if (previewImage && imagePreviewContainer) {
            previewImage.src = selectedImageBase64;
            imagePreviewContainer.style.display = 'block';
            
            const previewFileName = document.getElementById('previewFileName');
            const previewFileSize = document.getElementById('previewFileSize');
            
            if (previewFileName) {
                previewFileName.textContent = file.name;
            }
            
            if (previewFileSize) {
                previewFileSize.textContent = formatFileSize(file.size);
            }
        }
        
        imagePreviewContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeImage() {
    selectedImage = null;
    selectedImageBase64 = null;
    
    if (imagePreviewContainer) {
        imagePreviewContainer.style.display = 'none';
    }
    
    if (imageUpload) {
        imageUpload.value = '';
    }
}

// Add image message to chat
function addImageMessage(imageBase64, caption = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const name = document.createElement('strong');
    name.textContent = 'You';
    
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    header.appendChild(name);
    header.appendChild(time);
    
    const body = document.createElement('div');
    body.className = 'message-body';
    
    const img = document.createElement('img');
    img.src = imageBase64;
    img.style.maxWidth = '300px';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '12px';
    img.style.marginBottom = '10px';
    img.style.display = 'block';
    img.alt = 'Uploaded image';
    
    body.appendChild(img);
    
    if (caption) {
        const captionElement = document.createElement('div');
        captionElement.textContent = caption;
        captionElement.style.fontStyle = 'italic';
        captionElement.style.color = 'var(--text-secondary)';
        body.appendChild(captionElement);
    }
    
    content.appendChild(header);
    content.appendChild(body);
    
    messageDiv.appendChild(content);
    messageDiv.appendChild(avatar);
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    
    messageCount++;
}

// Add image analysis response
function addImageAnalysisResponse(text, analysis = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const name = document.createElement('strong');
    name.textContent = 'Ibnsina AI';
    
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="far fa-copy"></i>';
    copyBtn.title = 'Copy message';
    copyBtn.onclick = function() {
        copyMessage(this);
    };
    
    header.appendChild(name);
    header.appendChild(time);
    header.appendChild(copyBtn);
    
    const body = document.createElement('div');
    body.className = 'message-body';
    
    if (analysis) {
        const analysisDiv = document.createElement('div');
        analysisDiv.style.background = 'var(--bg-secondary)';
        analysisDiv.style.borderRadius = '12px';
        analysisDiv.style.padding = '15px';
        analysisDiv.style.marginBottom = '15px';
        analysisDiv.style.borderLeft = '4px solid var(--primary-color)';
        
        const analysisHeader = document.createElement('div');
        analysisHeader.innerHTML = '<strong><i class="fas fa-search"></i> Image Analysis</strong>';
        analysisHeader.style.marginBottom = '10px';
        analysisHeader.style.color = 'var(--text-primary)';
        
        const analysisContent = document.createElement('div');
        analysisContent.innerHTML = analysis;
        analysisContent.style.color = 'var(--text-secondary)';
        analysisContent.style.lineHeight = '1.6';
        
        analysisDiv.appendChild(analysisHeader);
        analysisDiv.appendChild(analysisContent);
        body.appendChild(analysisDiv);
    }
    
    if (text) {
        const textDiv = document.createElement('div');
        textDiv.innerHTML = text;
        body.appendChild(textDiv);
    }
    
    content.appendChild(header);
    content.appendChild(body);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    
    messageCount++;
}

// ===== UTILITY FUNCTIONS =====
function addRecentCommand(command) {
    const commandItem = document.createElement('div');
    commandItem.className = 'command-item';
    commandItem.textContent = command;
    
    commandItem.onclick = () => {
        userInput.value = command;
        userInput.focus();
    };
    
    recentCommands.insertBefore(commandItem, recentCommands.firstChild);
    
    if (recentCommands.children.length > 5) {
        recentCommands.removeChild(recentCommands.lastChild);
    }
}

function updateStats() {
    const uptimeMs = Date.now() - startTime;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const messageElements = document.querySelectorAll('.message:not(.welcome-message)');
    messageCount = messageElements.length;
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat?')) {
        const welcomeMsg = messages.querySelector('.welcome-message');
        messages.innerHTML = '';
        if (welcomeMsg) {
            messages.appendChild(welcomeMsg);
        }
        messageCount = 0;
        updateStats();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function redirectToLink() {
    window.location.href = "https://himel-profile-showcase.lovable.app";
}

// ===== EVENT LISTENERS ATTACHMENT =====
function attachEventListeners() {
    console.log('Attaching event listeners...');
    
    // Theme toggle
    setupThemeToggle();
    
    // Quick action buttons
    if (quickNews) quickNews.addEventListener('click', () => quickAction('news'));
    if (quickWeather) quickWeather.addEventListener('click', () => quickAction('weather'));
    if (quickTime) quickTime.addEventListener('click', () => quickAction('time'));
    if (quickJoke) quickJoke.addEventListener('click', () => quickAction('joke'));
    
    // Profile buttons
    if (userAvatar) userAvatar.addEventListener('click', openProfileModal);
    if (profileLinkBtn) profileLinkBtn.addEventListener('click', redirectToLink);
    
    // Image handling
    if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);
    if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
    
    // Chat buttons
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoice);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    
    // Footer buttons
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Modal close
    if (profileModalClose) profileModalClose.addEventListener('click', closeProfileModal);
    
    // Input field enter key
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            closeProfileModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter to send
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        
        // Escape to clear input or close modals
        if (e.key === 'Escape') {
            if (profileModal.style.display === 'flex') {
                closeProfileModal();
            } else {
                userInput.value = '';
            }
        }
        
        // Ctrl + / for voice
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            toggleVoice();
        }
        
        // Ctrl + D for dark mode
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (themeToggle) themeToggle.click();
        }
        
        // Ctrl + P for profile
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            openProfileModal();
        }
        
        // Ctrl + I for image upload
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            if (imageUpload) {
                imageUpload.click();
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeAllDrawers();
        }
        loadWeather();
    });
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing...');
    initializeApp();
    
    // Set interval for stats update
    setInterval(updateStats, 60000);
});

// Make functions globally available for HTML onclick attributes
window.redirectToLink = redirectToLink;
window.clearChat = clearChat;
window.toggleFullscreen = toggleFullscreen;
window.sendMessage = sendMessage;
window.toggleVoice = toggleVoice;
window.removeImage = removeImage;
window.closeProfileModal = closeProfileModal;
window.closeLeftDrawer = closeLeftDrawer;
window.closeRightDrawer = closeRightDrawer;
window.quickAction = quickAction;
window.openProfileModal = openProfileModal;