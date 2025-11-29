// ========================
// Cross-browser compatibility
// ========================
const browser = (() => {
    if (typeof window !== 'undefined') {
        return window.browser || window.chrome;
    }
    if (typeof self !== 'undefined') {
        return self.browser || self.chrome;
    }
    // Fallback for Firefox in certain contexts
    return globalThis.browser || globalThis.chrome;
})();

// ========================
// State Management
// ========================
let currentConversation = [];
let apiKey = '';
let selectedModel = 'gemini-2.0-flash-exp';
let systemInstructions = '';
let isProcessing = false;
let includePageContent = false;
let cachedPageContent = null;

// ========================
// DOM Elements
// ========================
const elements = {
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    modelInput: document.getElementById('modelInput'),
    systemInstructionsInput: document.getElementById('systemInstructionsInput'),
    presetPersonaSelect: document.getElementById('presetPersonaSelect'),
    charCount: document.getElementById('charCount'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    settingsAlert: document.getElementById('settingsAlert'),
    emptyState: document.getElementById('emptyState'),
    pageToggleBtn: document.getElementById('pageToggleBtn')
};

// ========================
// Preset Personas
// ========================
const PRESET_PERSONAS = {
    helper: "You are a friendly and helpful assistant. Provide clear, concise answers and always be supportive. Ask clarifying questions when needed.",
    coder: "You are an expert software engineer. Provide clean, well-documented code with explanations. Focus on best practices, performance, and maintainability. Use modern coding standards.",
    teacher: "You are a patient teacher. Break down complex topics into simple, easy-to-understand explanations. Use examples and analogies. Encourage learning and answer follow-up questions.",
    creative: "You are a creative writer with a vivid imagination. Craft engaging stories, poems, and creative content. Use descriptive language and bring ideas to life.",
    professional: "You are a professional business consultant. Provide well-structured, formal responses. Focus on clarity, efficiency, and actionable insights."
};

// ========================
// Initialization
// ========================
async function init() {
    await loadSettings();
    await loadConversation();
    setupEventListeners();
    autoResizeTextarea();

    // Check if API key is set
    if (!apiKey) {
        showSettings();
    }
}

// ========================
// Settings Management
// ========================
async function loadSettings() {
    try {
        const result = await browser.storage.local.get(['apiKey', 'selectedModel', 'systemInstructions']);
        apiKey = result.apiKey || '';
        selectedModel = result.selectedModel || 'gemini-2.0-flash-exp';
        systemInstructions = result.systemInstructions || '';

        elements.apiKeyInput.value = apiKey;
        elements.modelInput.value = selectedModel;
        elements.systemInstructionsInput.value = systemInstructions;
        updateCharCount();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const newApiKey = elements.apiKeyInput.value.trim();
    const newModel = elements.modelInput.value.trim();
    const newSystemInstructions = elements.systemInstructionsInput.value.trim();

    if (!newApiKey) {
        showAlert('Please enter your API key', 'error');
        return;
    }

    if (!newModel) {
        showAlert('Please enter a model name', 'error');
        return;
    }

    try {
        await browser.storage.local.set({
            apiKey: newApiKey,
            selectedModel: newModel,
            systemInstructions: newSystemInstructions
        });

        apiKey = newApiKey;
        selectedModel = newModel;
        systemInstructions = newSystemInstructions;

        showAlert('Settings saved successfully!', 'success');
        setTimeout(() => {
            hideSettings();
        }, 1000);
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Failed to save settings', 'error');
    }
}

function loadPresetPersona() {
    const selected = elements.presetPersonaSelect.value;
    if (selected && PRESET_PERSONAS[selected]) {
        elements.systemInstructionsInput.value = PRESET_PERSONAS[selected];
        updateCharCount();
    }
}

function updateCharCount() {
    const text = elements.systemInstructionsInput.value;
    const count = text.length;
    const max = 1000;
    elements.charCount.textContent = `${count} / ${max} characters`;
    if (count > max) {
        elements.charCount.style.color = '#EF4444';
    } else {
        elements.charCount.style.color = 'var(--text-tertiary)';
    }
}

function showAlert(message, type = 'info') {
    elements.settingsAlert.innerHTML = `<div class="alert ${type}">${message}</div>`;
}

function showSettings() {
    elements.settingsPanel.classList.add('active');
}

function hideSettings() {
    elements.settingsPanel.classList.remove('active');
    elements.settingsAlert.innerHTML = '';
}

// ========================
// Conversation Management
// ========================
async function loadConversation() {
    try {
        const result = await browser.storage.local.get(['conversation']);
        currentConversation = result.conversation || [];
        renderMessages();
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

async function saveConversation() {
    try {
        await browser.storage.local.set({ conversation: currentConversation });
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

function startNewChat() {
    currentConversation = [];
    saveConversation();
    renderMessages();
    elements.messageInput.focus();
}

// ========================
// Message Rendering
// ========================
function renderMessages() {
    // Clear container
    elements.messagesContainer.innerHTML = '';

    // Only show empty state if conversation is empty AND input is empty
    // This prevents showing empty state when user is editing a message
    if (currentConversation.length === 0 && !elements.messageInput.value.trim()) {
        elements.messagesContainer.innerHTML = `
      <div class="empty-state fade-in">
        <div class="empty-state-icon">💬</div>
        <h2 class="empty-state-title">Start a conversation</h2>
        <p class="empty-state-description">Ask me anything! I'm powered by Google's Gemini AI.</p>
      </div>
    `;
        return;
    }

    currentConversation.forEach((message, index) => {
        appendMessage(message.role, message.content, message.timestamp, false, index);
    });

    scrollToBottom();
}

function appendMessage(role, content, timestamp = Date.now(), animate = true, messageIndex = -1) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}${animate ? ' fade-in' : ''}`;
    messageDiv.dataset.messageIndex = messageIndex;

    const avatar = role === 'user' ? '👤' : '🤖';
    const name = role === 'user' ? 'You' : 'Gemini';
    const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create message actions for user and AI messages
    let actionsHtml = '';
    if (messageIndex >= 0) {
        if (role === 'user') {
            actionsHtml = `
                <div class="message-actions">
                    <button class="btn-action edit" data-action="edit" data-index="${messageIndex}" title="Edit message">✏️ Edit</button>
                    <button class="btn-action delete" data-action="delete" data-index="${messageIndex}" title="Delete message">🗑️ Delete</button>
                </div>
            `;
        } else if (role === 'ai') {
            actionsHtml = `
                <div class="message-actions">
                    <button class="btn-action regenerate" data-action="regenerate" data-index="${messageIndex}" title="Regenerate response">🔄 Regenerate</button>
                    <button class="btn-action delete" data-action="delete" data-index="${messageIndex}" title="Delete message">🗑️ Delete</button>
                </div>
            `;
        }
    }

    messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-name">${name}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-bubble">${formatMessage(content)}</div>
      ${actionsHtml}
    </div>
  `;

    elements.messagesContainer.appendChild(messageDiv);
    if (animate) {
        scrollToBottom();
    }

    return messageDiv;
}

function formatMessage(text) {
    // Simple markdown-like formatting
    let formatted = text
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>');

    return formatted;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;

    elements.messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

// ========================
// Page Content Access
// ========================
async function requestPageContent() {
    try {
        // Query the active tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            console.error('No active tab found');
            return null;
        }

        const activeTab = tabs[0];

        // Send message to content script to get page content
        const response = await browser.tabs.sendMessage(activeTab.id, { action: 'getPageContent' });

        if (response && response.success) {
            cachedPageContent = response;
            return response;
        } else {
            console.error('Failed to get page content:', response?.error);
            return null;
        }
    } catch (error) {
        console.error('Error requesting page content:', error);
        return null;
    }
}

function togglePageContent() {
    includePageContent = !includePageContent;

    // Update button visual state
    if (includePageContent) {
        elements.pageToggleBtn.classList.add('active');
        elements.pageToggleBtn.title = 'Page content enabled (click to disable)';
        // Request page content immediately when enabled
        requestPageContent();
    } else {
        elements.pageToggleBtn.classList.remove('active');
        elements.pageToggleBtn.title = 'Include page content';
        cachedPageContent = null;
    }
}

// ========================
// Gemini API Integration
// ========================
async function sendMessage() {
    const message = elements.messageInput.value.trim();

    if (!message || isProcessing) return;

    if (!apiKey) {
        showSettings();
        showAlert('Please configure your API key first', 'error');
        return;
    }

    // Clear input and disable
    elements.messageInput.value = '';
    autoResizeTextarea();
    isProcessing = true;
    updateSendButton();

    // Build the actual message to send
    let messageToSend = message;

    // If page content is enabled, fetch and prepend it
    if (includePageContent) {
        const pageContent = cachedPageContent || await requestPageContent();

        if (pageContent && pageContent.success) {
            // Format page content as context
            const contextPrefix = `[Page Context]\nTitle: ${pageContent.title}\nURL: ${pageContent.url}${pageContent.description ? '\nDescription: ' + pageContent.description : ''}\n\nContent:\n${pageContent.content}\n\n[User Question]\n`;
            messageToSend = contextPrefix + message;
        }
    }

    // Add user message (display only the user's actual message, not the full context)
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now()
    };
    currentConversation.push(userMessage);
    const userMsgIndex = currentConversation.length - 1;
    appendMessage('user', message, userMessage.timestamp, true, userMsgIndex);
    await saveConversation();

    // Show typing indicator
    showTypingIndicator();

    try {
        // Use non-streaming API (pass the full message with context)
        const response = await callGeminiAPI(messageToSend);
        hideTypingIndicator();

        if (response) {
            // Add AI response to conversation
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: Date.now()
            };
            currentConversation.push(aiMessage);
            const aiMsgIndex = currentConversation.length - 1;
            appendMessage('ai', response, aiMessage.timestamp, true, aiMsgIndex);
            await saveConversation();
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Error calling Gemini API:', error);

        const errorMessage = {
            role: 'ai',
            content: `Sorry, I encountered an error: ${error.message}. Please check your API key in settings.`,
            timestamp: Date.now()
        };
        appendMessage('ai', errorMessage.content, errorMessage.timestamp);
    } finally {
        isProcessing = false;
        updateSendButton();
        elements.messageInput.focus();
    }
}

async function callGeminiAPI(message) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    // Build conversation history in Gemini API format (excluding the current message)
    // We'll use the message parameter which may include page content
    const contents = currentConversation
        .slice(0, -1) // Exclude the last message we just added (will use 'message' param instead)
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{
                text: msg.content
            }]
        }));

    // Add the current message (this includes page content if enabled)
    contents.push({
        role: 'user',
        parts: [{
            text: message
        }]
    });

    // Build request body with full conversation history
    const requestBody = {
        contents: contents,
        generationConfig: {
            temperature: 0,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    // Add system instructions if configured
    if (systemInstructions) {
        requestBody.systemInstruction = {
            parts: [{
                text: systemInstructions
            }]
        };
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('No response from API');
    }

    return text;
}

// ========================
// Message Actions
// ========================
function editMessage(index) {
    if (index < 0 || index >= currentConversation.length) return;

    const message = currentConversation[index];
    if (message.role !== 'user') return;

    // Find the message element
    const messageElements = elements.messagesContainer.querySelectorAll('.message.user');
    let messageElement = null;

    // Find the correct message element by index
    for (let elem of messageElements) {
        if (parseInt(elem.dataset.messageIndex) === index) {
            messageElement = elem;
            break;
        }
    }

    if (!messageElement) return;

    const messageBubble = messageElement.querySelector('.message-bubble');
    const messageActions = messageElement.querySelector('.message-actions');

    if (!messageBubble) return;

    // Store original content
    const originalContent = message.content;

    // Make the bubble editable
    messageBubble.contentEditable = 'true';
    messageBubble.classList.add('editing');
    messageBubble.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(messageBubble);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Hide original actions and show edit actions
    if (messageActions) {
        messageActions.style.display = 'none';
    }

    // Create edit actions
    const editActions = document.createElement('div');
    editActions.className = 'message-edit-actions';
    editActions.innerHTML = `
        <button class="btn-edit-action save" title="Save changes">✓ Save</button>
        <button class="btn-edit-action cancel" title="Cancel editing">✕ Cancel</button>
    `;

    messageBubble.parentElement.appendChild(editActions);

    // Handle save
    const saveBtn = editActions.querySelector('.save');
    const cancelBtn = editActions.querySelector('.cancel');

    const finishEditing = (save) => {
        messageBubble.contentEditable = 'false';
        messageBubble.classList.remove('editing');
        editActions.remove();

        if (messageActions) {
            messageActions.style.display = '';
        }

        if (save) {
            // Get the edited text (strip HTML)
            const editedText = messageBubble.textContent.trim();

            if (editedText && editedText !== originalContent) {
                // Update the conversation
                currentConversation[index].content = editedText;
                currentConversation[index].timestamp = Date.now();

                // Save and re-render
                saveConversation();
                renderMessages();
            } else {
                // Restore original if empty or unchanged
                messageBubble.textContent = originalContent;
            }
        } else {
            // Cancel - restore original content
            messageBubble.textContent = originalContent;
        }
    };

    saveBtn.addEventListener('click', () => finishEditing(true));
    cancelBtn.addEventListener('click', () => finishEditing(false));

    // Handle Enter to save, Escape to cancel
    messageBubble.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishEditing(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finishEditing(false);
        }
    });

    // Handle blur (click outside) - save changes
    messageBubble.addEventListener('blur', (e) => {
        // Small delay to allow button clicks to register
        setTimeout(() => {
            if (messageBubble.contentEditable === 'true') {
                finishEditing(true);
            }
        }, 200);
    });
}

async function regenerateMessage(index) {
    if (index < 0 || index >= currentConversation.length) return;

    const message = currentConversation[index];
    if (message.role !== 'ai') return;

    // Find the previous user message
    let userMessageIndex = index - 1;
    while (userMessageIndex >= 0 && currentConversation[userMessageIndex].role !== 'user') {
        userMessageIndex--;
    }

    if (userMessageIndex < 0) return;

    const userMessage = currentConversation[userMessageIndex].content;

    // Delete from AI message onwards
    currentConversation = currentConversation.slice(0, index);
    await saveConversation();
    renderMessages();

    // Resend the user message
    isProcessing = true;
    updateSendButton();

    showTypingIndicator();

    try {
        const response = await callGeminiAPI(userMessage);
        hideTypingIndicator();

        if (response) {
            const aiMessage = {
                role: 'ai',
                content: response,
                timestamp: Date.now()
            };
            currentConversation.push(aiMessage);
            const aiMsgIndex = currentConversation.length - 1;
            appendMessage('ai', response, aiMessage.timestamp, true, aiMsgIndex);
            await saveConversation();
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Error regenerating message:', error);

        const errorMessage = {
            role: 'ai',
            content: `Sorry, I encountered an error: ${error.message}`,
            timestamp: Date.now()
        };
        appendMessage('ai', errorMessage.content, errorMessage.timestamp);
    } finally {
        isProcessing = false;
        updateSendButton();
    }
}

function deleteMessage(index) {
    if (index < 0 || index >= currentConversation.length) return;

    const message = currentConversation[index];
    const messageType = message.role === 'user' ? 'user message' : 'AI response';

    // Confirm deletion
    const confirmed = confirm(`Delete this ${messageType}?`);
    if (!confirmed) return;

    // Delete only this specific message
    currentConversation.splice(index, 1);
    saveConversation();
    renderMessages();
}

// ========================
// Event Listeners
// ========================
function setupEventListeners() {
    // Send message
    elements.sendBtn.addEventListener('click', sendMessage);

    // Enter to send, Shift+Enter for new line
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    elements.messageInput.addEventListener('input', autoResizeTextarea);

    // New chat
    elements.newChatBtn.addEventListener('click', startNewChat);

    // Settings
    elements.settingsBtn.addEventListener('click', showSettings);
    elements.closeSettingsBtn.addEventListener('click', hideSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Preset persona selector
    elements.presetPersonaSelect.addEventListener('change', loadPresetPersona);

    // Character counter for system instructions
    elements.systemInstructionsInput.addEventListener('input', updateCharCount);

    // Page content toggle
    elements.pageToggleBtn.addEventListener('click', togglePageContent);

    // Message actions - event delegation
    elements.messagesContainer.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.btn-action');
        if (!actionBtn) return;

        const action = actionBtn.dataset.action;
        const index = parseInt(actionBtn.dataset.index, 10);

        if (action === 'edit') {
            editMessage(index);
        } else if (action === 'regenerate') {
            regenerateMessage(index);
        } else if (action === 'delete') {
            deleteMessage(index);
        }
    });
}

function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    elements.sendBtn.disabled = isProcessing;
}

// ========================
// Start Application
// ========================
init();
