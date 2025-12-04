(function () {
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
    // Helper Functions
    // ========================
    function openUrl(url) {
        try {
            if (typeof browser !== 'undefined' && browser.tabs) {
                return browser.tabs.create({ url });
            } else if (typeof chrome !== 'undefined' && chrome.tabs) {
                return chrome.tabs.create({ url });
            } else if (typeof window !== 'undefined') {
                return window.open(url, '_blank');
            }
            throw new Error('No API available to open URL');
        } catch (e) {
            console.error('Failed to open URL:', e);
            throw e;
        }
    }

    async function closeCurrentTab() {
        console.log('🔧 [Tool] closeCurrentTab() called');
        try {
            // Send message to background script to close current tab
            const response = await browser.runtime.sendMessage({
                action: 'close_current_tab'
            });

            console.log('🔧 [Tool] Background response for closeCurrentTab:', response);

            if (response && response.success) {
                console.log('✅ [Tool] Successfully closed tab:', response.tabId);
                return response.tabId;
            }

            throw new Error(response?.error || 'Failed to close current tab');
        } catch (error) {
            console.error('❌ [Tool] ERROR in closeCurrentTab:', error);
            throw error;
        }
    }

    async function reloadPage() {
        console.log('🔧 [Tool] reloadPage() called');
        try {
            // Send message to background script to reload current tab
            const response = await browser.runtime.sendMessage({
                action: 'reload_current_tab'
            });

            console.log('🔧 [Tool] Background response for reloadPage:', response);

            if (response && response.success) {
                console.log('✅ [Tool] Successfully reloaded tab:', response.tabId);
                return response.tabId;
            }

            throw new Error(response?.error || 'Failed to reload current tab');
        } catch (error) {
            console.error('❌ [Tool] ERROR in reloadPage:', error);
            throw error;
        }
    }

    async function reloadTab(query) {
        console.log('🔧 [Tool] reloadTab() called with query:', query);
        try {
            // Send message to background script
            const response = await browser.runtime.sendMessage({
                action: 'reload_tab',
                query: query
            });

            console.log('🔧 [Tool] Background response for reloadTab:', response);

            if (response && response.success) {
                console.log('✅ [Tool] Successfully reloaded tab:', response.tabId);
                return response.tabId;
            }

            throw new Error(response?.error || 'Failed to reload tab');
        } catch (error) {
            console.error('❌ [Tool] Error reloading tab:', error);
            throw error;
        }
    }

    function goBack() {
        const script = 'window.history.back();';
        executeScript(script);
    }

    function goForward() {
        const script = 'window.history.forward();';
        executeScript(script);
    }

    async function duplicateCurrentTab() {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                await browser.tabs.duplicate(tabs[0].id);
            }
        } catch (error) {
            console.error('Error duplicating tab:', error);
            throw error;
        }
    }

    function executeScript(code) {
        const api = (typeof browser !== 'undefined' ? browser : chrome);
        if (api && api.tabs && api.scripting) {
            api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    api.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: (code) => { window.eval(code); },
                        args: [code]
                    }).catch(err => console.error('Script execution failed:', err));
                }
            });
        }
    }

    async function listTabs() {
        console.log('🔧 [Tool] listTabs() called');
        try {
            // Send message to background script
            const response = await browser.runtime.sendMessage({ action: 'list_tabs' });
            console.log('🔧 [Tool] Background response for listTabs:', response);
            if (response && response.success) {
                console.log(`✅ [Tool] Found ${response.tabs.length} tabs`);
                return response.tabs.map(t => ({ id: t.id, title: t.title, url: t.url }));
            }
            throw new Error(response?.error || 'Failed to list tabs');
        } catch (error) {
            console.error('❌ [Tool] Error listing tabs:', error);
            return [];
        }
    }

    async function switchTab(query) {
        try {
            console.log('🔧 [Tool] switchTab() called with query:', query);

            // Send message to background script
            const response = await browser.runtime.sendMessage({
                action: 'switch_tab',
                query: query
            });

            console.log('🔧 [Tool] Background response for switchTab:', response);

            if (response && response.success) {
                console.log('✅ [Tool] Successfully switched to tab:', response.tabId);
                return response.tabId;
            }

            throw new Error(response?.error || 'Failed to switch tab');
        } catch (error) {
            console.error('❌ [Tool] Error switching tab:', error);
            throw error;
        }
    }

    async function closeTab(query) {
        console.log('🔧 [Tool] closeTab() called with query:', query);
        try {
            // Send message to background script
            const response = await browser.runtime.sendMessage({
                action: 'close_tab',
                query: query
            });

            console.log('🔧 [Tool] Background response for closeTab:', response);

            if (response && response.success) {
                console.log('✅ [Tool] Successfully closed tab(s):', response.tabId || response.count);
                return response.tabId;
            }

            throw new Error(response?.error || 'Failed to close tab');
        } catch (error) {
            console.error('❌ [Tool] Error closing tab:', error);
            throw error;
        }
    }

    async function groupTabs(tabIds, name) {
        try {
            // Send message to background script
            const response = await browser.runtime.sendMessage({
                action: 'group_tabs',
                tabIds: tabIds,
                name: name
            });

            if (response && response.success) {
                return response.groupId;
            }

            // Return null if not supported or failed
            return null;
        } catch (error) {
            console.error('Error grouping tabs:', error);
            return null;
        }
    }

    function scrollPage(direction, amount = 500) {
        const script = `window.scrollBy({ top: ${direction === 'up' ? -amount : amount}, behavior: 'smooth' });`;
        executeScript(script);
    }

    function clickElement(selector) {
        const script = `
            const el = document.querySelector('${selector}');
            if (el) {
                el.click();
                el.focus();
            } else {
                console.warn('Element not found: ${selector}');
            }
        `;
        executeScript(script);
    }

    function typeInput(selector, text) {
        const script = `
            const el = document.querySelector('${selector}');
            if (el) {
                el.value = '${text}';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.warn('Element not found: ${selector}');
            }
        `;
        executeScript(script);
    }

    function highlightElement(selector) {
        const script = `
            const el = document.querySelector('${selector}');
            if (el) {
                const originalOutline = el.style.outline;
                el.style.outline = '4px solid #FF0000';
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    el.style.outline = originalOutline;
                }, 3000);
            } else {
                console.warn('Element not found: ${selector}');
            }
        `;
        executeScript(script);
    }

    // ========================
    // State Management
    // ========================
    let currentConversation = [];
    let currentConversationId = null;
    let apiKey = '';
    let selectedModel = 'gemini-2.0-flash-exp';
    let systemInstructions = '';
    let isProcessing = false;
    let includePageContent = false;
    let cachedPageContent = null;
    let saveTimeout = null; // Debounce auto-save
    let commandAutocomplete = null; // Command autocomplete instance
    let selectedImages = []; // Array of selected images for vision

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
        pageToggleBtn: document.getElementById('pageToggleBtn'),
        // History panel elements
        historyBtn: document.getElementById('historyBtn'),
        historyPanel: document.getElementById('historyPanel'),
        closeHistoryBtn: document.getElementById('closeHistoryBtn'),
        historySearchInput: document.getElementById('historySearchInput'),
        historyList: document.getElementById('historyList'),
        historyEmptyState: document.getElementById('historyEmptyState'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        // Image upload elements
        imageAttachBtn: document.getElementById('imageAttachBtn'),
        screenshotBtn: document.getElementById('screenshotBtn'),
        imageInput: document.getElementById('imageInput'),
        imagePreviewContainer: document.getElementById('imagePreviewContainer'),
        imagePreviewList: document.getElementById('imagePreviewList')
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

        // Initialize command autocomplete
        commandAutocomplete = new CommandAutocomplete(
            commandRegistry,
            elements.messageInput,
            (cmd) => {
                console.log('Command selected:', cmd.name);
            }
        );

        // Check if API key is set
        if (!apiKey) {
            showSettings();
        }

        // Setup image drag and drop
        setupImageDragDrop();

        // Setup paste handler for images
        elements.messageInput.addEventListener('paste', handleImagePaste);
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
    // Conversation Management with History
    // ========================
    async function loadConversation() {
        try {
            // Get current conversation ID
            currentConversationId = await conversationStorage.getCurrentConversationId();

            if (currentConversationId) {
                // Load existing conversation
                const conv = await conversationStorage.getConversation(currentConversationId);
                if (conv) {
                    currentConversation = conv.messages || [];
                } else {
                    // Conversation not found, create new
                    await startNewChat();
                }
            } else {
                // No current conversation, create new
                await startNewChat();
            }

            renderMessages();
            await updateHistoryList();
        } catch (error) {
            console.error('Error loading conversation:', error);
            currentConversation = [];
            renderMessages();
        }
    }

    async function saveConversation() {
        if (!currentConversationId) return;

        // Debounce saving
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(async () => {
            try {
                // Generate smart title if still "New Chat"
                const conv = await conversationStorage.getConversation(currentConversationId);
                let title = conv?.title || 'New Chat';

                if (title === 'New Chat' && currentConversation.length > 0) {
                    title = conversationStorage.generateSmartTitle(currentConversation);
                }

                await conversationStorage.updateConversation(currentConversationId, {
                    title,
                    messages: currentConversation
                });

                await updateHistoryList();
            } catch (error) {
                console.error('Error saving conversation:', error);
            }
        }, 500); // Save 500ms after last change
    }

    async function startNewChat() {
        try {
            // Create new conversation
            const newConv = await conversationStorage.createConversation('New Chat', []);

            if (newConv) {
                currentConversationId = newConv.id;
                currentConversation = [];
                renderMessages();
                await updateHistoryList();
                elements.messageInput.focus();
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
        }
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
            // Since we're running in an iframe inside a content script,
            // we need to use postMessage to communicate with the parent (sidebar.js)
            return new Promise((resolve) => {
                // Create a unique ID for this request
                const requestId = `pageContent_${Date.now()}`;

                // Listen for the response
                const messageHandler = (event) => {
                    // Verify message is from our extension
                    if (event.data && event.data.type === 'pageContentResponse' && event.data.requestId === requestId) {
                        window.removeEventListener('message', messageHandler);

                        if (event.data.success) {
                            cachedPageContent = event.data;
                            resolve(event.data);
                        } else {
                            console.error('Failed to get page content:', event.data.error);
                            resolve(null);
                        }
                    }
                };

                window.addEventListener('message', messageHandler);

                // Send request to parent window (sidebar.js content script)
                window.parent.postMessage({
                    type: 'requestPageContent',
                    requestId: requestId
                }, '*');

                // Timeout after 5 seconds
                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    console.error('Page content request timed out');
                    resolve(null);
                }, 5000);
            });
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
    // Image Handling for Vision
    // ========================
    async function handleImageSelect(event) {
        const files = Array.from(event.target.files).slice(0, 4 - selectedImages.length); // Max 4 images

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await addImage(file);
            }
        }

        // Reset input
        elements.imageInput.value = '';
    }

    async function addImage(file) {
        if (selectedImages.length >= 4) {
            alert('Maximum 4 images allowed per message');
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            const imageData = {
                data: base64,
                mimeType: file.type,
                name: file.name
            };

            selectedImages.push(imageData);
            updateImagePreviews();
        } catch (error) {
            console.error('Error adding image:', error);
            alert('Failed to add image');
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data URL prefix to get just base64
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function updateImagePreviews() {
        if (selectedImages.length === 0) {
            elements.imagePreviewContainer.style.display = 'none';
            return;
        }

        elements.imagePreviewContainer.style.display = 'block';
        elements.imagePreviewList.innerHTML = '';

        selectedImages.forEach((img, index) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview-item';

            const imgEl = document.createElement('img');
            imgEl.src = `data:${img.mimeType};base64,${img.data}`;
            imgEl.alt = img.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'image-preview-remove';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => removeImage(index);

            preview.appendChild(imgEl);
            preview.appendChild(removeBtn);
            elements.imagePreviewList.appendChild(preview);
        });
    }

    function removeImage(index) {
        selectedImages.splice(index, 1);
        updateImagePreviews();
    }

    function clearImages() {
        selectedImages = [];
        updateImagePreviews();
    }

    // Handle paste images
    async function handleImagePaste(event) {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                event.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await addImage(file);
                }
            }
        }
    }

    // Handle drag and drop
    function setupImageDragDrop() {
        const inputWrapper = elements.messageInput.parentElement;

        inputWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            inputWrapper.style.borderColor = 'var(--color-primary)';
        });

        inputWrapper.addEventListener('dragleave', (e) => {
            inputWrapper.style.borderColor = '';
        });

        inputWrapper.addEventListener('drop', async (e) => {
            e.preventDefault();
            inputWrapper.style.borderColor = '';

            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            for (const file of files.slice(0, 4 - selectedImages.length)) {
                await addImage(file);
            }
        });
    }

    // Capture screenshot
    async function captureScreenshot() {
        try {
            // Request screenshot from content script via parent
            window.parent.postMessage({
                type: 'captureScreenshot',
                requestId: `screenshot_${Date.now()}`
            }, '*');

            // Listen for response
            const messageHandler = (event) => {
                if (event.data && event.data.type === 'screenshotCaptured') {
                    window.removeEventListener('message', messageHandler);

                    if (event.data.success && event.data.imageData) {
                        // Convert data URL to base64
                        const base64 = event.data.imageData.split(',')[1];
                        const imageData = {
                            data: base64,
                            mimeType: 'image/png',
                            name: 'screenshot.png'
                        };

                        selectedImages.push(imageData);
                        updateImagePreviews();
                    } else {
                        alert('Failed to capture screenshot. Make sure you are on a valid webpage.');
                    }
                }
            };

            window.addEventListener('message', messageHandler);

            // Timeout after 5 seconds
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
            }, 5000);

        } catch (error) {
            console.error('Screenshot error:', error);
            alert('Failed to capture screenshot');
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

        // Check if this is a command
        const parsed = commandParser.parse(message);

        if (parsed.isCommand) {
            if (!parsed.command) {
                // Unknown command - show error
                elements.messageInput.value = '';
                autoResizeTextarea();

                const errorMsg = {
                    role: 'ai',
                    content: parsed.error,
                    timestamp: Date.now()
                };
                appendMessage('ai', errorMsg.content, errorMsg.timestamp);
                return;
            }

            // Execute command
            try {
                elements.messageInput.value = '';
                autoResizeTextarea();

                const context = {
                    getPageContent: requestPageContent,
                    selectedText: null, // TODO: Add selected text support
                    startNewChat,
                    exportCurrentConversation: async () => {
                        const conv = await conversationStorage.getConversation(currentConversationId);
                        if (conv) {
                            exportConversation(conv);
                        }
                    }
                };

                const result = await commandParser.execute(parsed, context);

                // If command returns null, it handled everything (like /clear, /export)
                if (result === null) {
                    return;
                }

                // If command returns a string, use it as the message
                elements.messageInput.value = result;
                // Don't send yet - let user review/edit
                autoResizeTextarea();
                elements.messageInput.focus();
                return;

            } catch (error) {
                console.error('Command error:', error);
                const errorMsg = {
                    role: 'ai',
                    content: `Command error: ${error.message}`,
                    timestamp: Date.now()
                };
                appendMessage('ai', errorMsg.content, errorMsg.timestamp);
                return;
            }
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
            timestamp: Date.now(),
            images: selectedImages.length > 0 ? [...selectedImages] : undefined
        };
        currentConversation.push(userMessage);
        const userMsgIndex = currentConversation.length - 1;
        appendMessage('user', message, userMessage.timestamp, true, userMsgIndex);
        await saveConversation();

        // Show typing indicator
        showTypingIndicator();

        try {
            // Iterative tool execution loop
            let currentMessage = messageToSend;
            let iterations = 0;
            const MAX_ITERATIONS = 10;
            let allToolResults = [];

            while (iterations < MAX_ITERATIONS) {
                console.log(`🔧 Tool iteration ${iterations + 1}/${MAX_ITERATIONS}`);

                // Use non-streaming API
                const response = await callGeminiAPI(currentMessage, iterations === 0 ? selectedImages : []);

                // Check if this is a tool call
                let toolCallDetected = false;
                try {
                    let cleanResponse = response.trim();

                    // Attempt to extract JSON object or array if it's wrapped in text or markdown
                    const jsonMatch = cleanResponse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                    if (jsonMatch) {
                        cleanResponse = jsonMatch[0];
                    }

                    // Try to parse
                    const parsed = JSON.parse(cleanResponse);

                    // Normalize to array
                    const toolCalls = Array.isArray(parsed) ? parsed : [parsed];

                    // Check if valid tool calls
                    const validCalls = toolCalls.filter(tc => tc && tc.tool);

                    if (validCalls.length > 0) {
                        toolCallDetected = true;
                        console.log(`🔧 Executing ${validCalls.length} tool call(s)`);

                        // Execute all tool calls and collect results
                        const toolResults = [];

                        for (const toolCall of validCalls) {
                            try {
                                const result = await executeSingleTool(toolCall);
                                toolResults.push(result);
                                allToolResults.push(result);
                            } catch (error) {
                                const errorResult = {
                                    tool: toolCall.tool,
                                    success: false,
                                    error: error.message
                                };
                                toolResults.push(errorResult);
                                allToolResults.push(errorResult);
                            }
                        }

                        // Format tool results as message for AI
                        currentMessage = formatToolResultsForAI(toolResults);
                        console.log(`🔧 Tool results:`, toolResults);

                        iterations++;
                        continue; // Continue loop to let AI process results
                    }
                } catch (e) {
                    // Not a valid JSON tool call
                    console.log('Response was not a tool call:', e);
                }

                // If we get here, it's a final text response from AI
                hideTypingIndicator();

                // Add AI response to conversation
                addAiMessage(response);
                return;
            }

            // If we hit max iterations
            hideTypingIndicator();
            const summary = summarizeToolResults(allToolResults);
            addAiMessage(`Completed ${allToolResults.length} tool operations:\n${summary}\n\n(Reached maximum iteration limit)`);

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
            clearImages(); // Clear images after sending
            elements.messageInput.focus();
        }
    }

    function addAiMessage(content) {
        const aiMessage = {
            role: 'ai',
            content: content,
            timestamp: Date.now()
        };
        currentConversation.push(aiMessage);
        const aiMsgIndex = currentConversation.length - 1;
        appendMessage('ai', content, aiMessage.timestamp, true, aiMsgIndex);
        saveConversation();
    }

    // Helper to execute a single tool and return result
    async function executeSingleTool(toolCall) {
        console.log(`🔧 [Executor] Executing tool: ${toolCall.tool}`, toolCall.args || toolCall);
        const result = {
            tool: toolCall.tool,
            success: true,
            result: null
        };

        try {
            if (toolCall.tool === 'open_url' && toolCall.url) {
                openUrl(toolCall.url);
                result.result = `Opened ${toolCall.url}`;
            } else if (toolCall.tool === 'close_current_tab') {
                const tabId = await closeCurrentTab();
                result.result = `Closed current tab (ID: ${tabId})`;
            } else if (toolCall.tool === 'reload_page') {
                const tabId = await reloadPage();
                result.result = `Reloaded current tab (ID: ${tabId})`;
            } else if (toolCall.tool === 'reload_tab' && toolCall.query) {
                await reloadTab(toolCall.query);
                result.result = `Reloaded tab matching "${toolCall.query}"`;
            } else if (toolCall.tool === 'go_back') {
                goBack();
                result.result = 'Navigated back';
            } else if (toolCall.tool === 'go_forward') {
                goForward();
                result.result = 'Navigated forward';
            } else if (toolCall.tool === 'duplicate_tab') {
                await duplicateCurrentTab();
                result.result = 'Duplicated current tab';
            } else if (toolCall.tool === 'list_tabs') {
                const tabs = await listTabs();
                // Return structured data for AI to analyze
                result.result = tabs;
                result.isData = true; // Flag to indicate this is raw data
            } else if (toolCall.tool === 'switch_tab' && (toolCall.query || toolCall.tabId)) {
                const query = toolCall.query || toolCall.tabId;
                await switchTab(query);
                result.result = `Switched to tab matching "${query}"`;
            } else if (toolCall.tool === 'close_tab' && (toolCall.query || toolCall.tabId)) {
                const query = toolCall.query || toolCall.tabId;
                await closeTab(query);
                result.result = `Closed tab matching "${query}"`;
            } else if (toolCall.tool === 'group_tabs' && toolCall.tabIds) {
                const groupId = await groupTabs(toolCall.tabIds, toolCall.name);
                if (groupId) {
                    result.result = `Grouped tabs into "${toolCall.name || 'Group'}"`;
                } else {
                    throw new Error('Grouping not supported');
                }
            } else if (toolCall.tool === 'scroll_page') {
                scrollPage(toolCall.direction, toolCall.amount);
                result.result = `Scrolled ${toolCall.direction || 'down'}`;
            } else if (toolCall.tool === 'click_element' && toolCall.selector) {
                clickElement(toolCall.selector);
                result.result = `Clicked element "${toolCall.selector}"`;
            } else if (toolCall.tool === 'type_input' && toolCall.selector && toolCall.text) {
                typeInput(toolCall.selector, toolCall.text);
                result.result = `Typed "${toolCall.text}" into "${toolCall.selector}"`;
            } else if (toolCall.tool === 'highlight_element' && toolCall.selector) {
                highlightElement(toolCall.selector);
                result.result = `Highlighted "${toolCall.selector}"`;
            } else {
                throw new Error(`Unknown tool: ${toolCall.tool}`);
            }
        } catch (error) {
            result.success = false;
            result.error = error.message;
        }

        return result;
    }

    // Helper to format tool results for AI consumption
    function formatToolResultsForAI(results) {
        let message = "Tool execution results:\n";

        results.forEach(r => {
            message += `\nTool: ${r.tool}\n`;
            message += `Status: ${r.success ? 'Success' : 'Failed'}\n`;

            if (r.success) {
                if (r.isData) {
                    // Format raw data (like tab list) as JSON for AI analysis
                    message += `Result: ${JSON.stringify(r.result)}\n`;
                } else {
                    message += `Result: ${r.result}\n`;
                }
            } else {
                message += `Error: ${r.error}\n`;
            }
        });

        message += "\nBased on these results, you can now:\n";
        message += "1. Call more tools (respond with JSON tool calls)\n";
        message += "2. Provide a final answer to the user (respond with text)\n";

        return message;
    }

    // Helper to summarize results for user display
    function summarizeToolResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        let summary = "";

        if (successful.length > 0) {
            summary += "✅ Successfully:\n";
            successful.forEach(r => {
                if (r.tool === 'list_tabs') {
                    summary += `- Listed ${r.result.length} open tabs\n`;
                } else {
                    summary += `- ${r.result}\n`;
                }
            });
        }

        if (failed.length > 0) {
            summary += "\n❌ Failed to:\n";
            failed.forEach(r => {
                summary += `- ${r.tool}: ${r.error}\n`;
            });
        }

        return summary.trim();
    }

    async function callGeminiAPI(message, images = []) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

        // Build conversation history in Gemini API format (excluding the current message)
        // We'll use the message parameter which may include page content
        const contents = currentConversation
            .slice(0, -1) // Exclude the last message we just added (will use 'message' param instead)
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: msg.images ?
                    [
                        { text: msg.content },
                        ...msg.images.map(img => ({
                            inline_data: {
                                mime_type: img.mimeType,
                                data: img.data
                            }
                        }))
                    ] :
                    [{ text: msg.content }]
            }));

        // Add the current message (this includes page content if enabled)
        // Build parts array with text and images
        const currentParts = [{ text: message }];

        if (images && images.length > 0) {
            for (const img of images) {
                currentParts.push({
                    inline_data: {
                        mime_type: img.mimeType,
                        data: img.data
                    }
                });
            }
        }

        contents.push({
            role: 'user',
            parts: currentParts
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
        let finalSystemInstructions = systemInstructions || '';

        // Add tool definitions
        finalSystemInstructions += `\n\nYou have access to the following tools:
- open_url(url): Opens a new tab with the specified URL.
- close_current_tab(): Closes the currently active tab.
- reload_page(): Reloads the current page.
- reload_tab(query): Reloads a specific tab matching the query (ID, title, or URL).
- go_back(): Navigates back in the browser history.
- go_forward(): Navigates forward in the browser history.
- duplicate_tab(): Duplicates the currently active tab.
- list_tabs(): Returns a list of all open tabs with their IDs, titles, and URLs.
- switch_tab(query): Switches focus to the tab matching the query (ID, title, or URL).
- close_tab(query): Closes the tab matching the query (ID, title, or URL).
- group_tabs(tabIds, name): Groups the specified tabs (by ID) and optionally names the group.
- scroll_page(direction, amount): Scrolls the page 'up' or 'down'. Default amount is 500.
- click_element(selector): Clicks the element matching the CSS selector.
- type_input(selector, text): Types text into the element matching the CSS selector.
- highlight_element(selector): Visually highlights the element matching the CSS selector.

IMPORTANT: 
- If user refers to "this tab", "current tab", or just "the page", use close_current_tab() or reload_page()
- If user refers to a SPECIFIC tab by name/URL, use close_tab(query) or reload_tab(query)

ITERATIVE TOOL USE:
You can call tools iteratively to solve complex tasks. 
1. Call a tool (e.g., list_tabs)
2. You will receive the results of that tool call
3. Based on the results, you can call more tools or provide a final answer
4. Repeat as needed

Example: "Close all khanacademy tabs except the one on statistics"
1. Call: {"tool": "list_tabs"}
2. System returns list of tabs
3. You analyze the list, find the IDs of tabs to close
4. Call: [{"tool": "close_tab", "query": 456}, {"tool": "close_tab", "query": 789}]
5. System confirms closure
6. You respond: "Closed 2 Khan Academy tabs, kept Statistics tab open."

To use a tool, respond with ONLY a JSON object OR a JSON array of objects in this format:
{"tool": "tool_name", "args": ...}
or
[{"tool": "tool_name", "args": ...}, {"tool": "tool_name", "args": ...}]

Examples:
{"tool": "open_url", "url": "https://example.com"}
[{"tool": "open_url", "url": "https://google.com"}, {"tool": "open_url", "url": "https://youtube.com"}]
{"tool": "close_current_tab"}
{"tool": "reload_page"}
{"tool": "reload_tab", "query": "khan academy"}
{"tool": "reload_tab", "query": 123}
{"tool": "go_back"}
{"tool": "go_forward"}
{"tool": "duplicate_tab"}
{"tool": "list_tabs"}
{"tool": "switch_tab", "query": "khan academy"}
{"tool": "switch_tab", "query": 123}
{"tool": "close_tab", "query": "youtube"}
{"tool": "scroll_page", "direction": "down"}
{"tool": "click_element", "selector": "button.submit"}`;

        if (finalSystemInstructions) {
            requestBody.systemInstruction = {
                parts: [{
                    text: finalSystemInstructions
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
    // History Panel Management
    // ========================
    function showHistory() {
        elements.historyPanel.classList.add('active');
        updateHistoryList();
    }

    function hideHistory() {
        elements.historyPanel.classList.remove('active');
        elements.historySearchInput.value = '';
    }

    async function updateHistoryList(searchQuery = '') {
        try {
            let conversations;

            if (searchQuery.trim()) {
                // Search conversations
                conversations = await conversationStorage.searchConversations(searchQuery);
            } else {
                // Get all conversations sorted by date
                conversations = await conversationStorage.getConversationsSorted('updatedAt', false);
            }

            // Show/hide empty state
            if (conversations.length === 0) {
                elements.historyEmptyState.style.display = 'flex';
                elements.historyList.style.display = 'none';
                return;
            } else {
                elements.historyEmptyState.style.display = 'none';
                elements.historyList.style.display = 'flex';
            }

            // Render conversation list
            elements.historyList.innerHTML = '';

            for (const conv of conversations) {
                const item = createHistoryItem(conv, searchQuery);
                elements.historyList.appendChild(item);
            }
        } catch (error) {
            console.error('Error updating history list:', error);
        }
    }

    function createHistoryItem(conversation, searchQuery = '') {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.conversationId = conversation.id;

        // Mark as active if this is the current conversation
        if (conversation.id === currentConversationId) {
            item.classList.add('active');
        }

        // Format dates
        const updatedDate = new Date(conversation.updatedAt);
        const isToday = updatedDate.toDateString() === new Date().toDateString();
        const timeStr = isToday
            ? updatedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Get preview (first message)
        const preview = conversation.messages.length > 0
            ? conversation.messages[0].content.substring(0, 60)
            : 'Empty conversation';

        // Highlight search terms if searching
        let title = conversation.title;
        if (searchQuery) {
            const regex = new RegExp(`(${searchQuery})`, 'gi');
            title = title.replace(regex, '<span class="search-highlight">$1</span>');
        }

        item.innerHTML = `
        <div class="history-item-header">
            <div class="history-item-title">${title}</div>
            <div class="history-item-actions">
                <button class="history-item-action" data-action="export" title="Export">💾</button>
                <button class="history-item-action" data-action="delete" title="Delete">🗑️</button>
            </div>
        </div>
        <div class="history-item-meta">
            <span>${timeStr}</span>
            <span>•</span>
            <span>${conversation.messages.length} messages</span>
        </div>
        <div class="history-item-preview">${preview}</div>
    `;

        // Click to load conversation
        item.addEventListener('click', (e) => {
            // Don't load if clicking action buttons
            if (e.target.closest('.history-item-action')) return;
            loadHistoryConversation(conversation.id);
        });

        // Export button
        const exportBtn = item.querySelector('[data-action="export"]');
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportConversation(conversation);
        });

        // Delete button
        const deleteBtn = item.querySelector('[data-action="delete"]');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryConversation(conversation.id, conversation.title);
        });

        return item;
    }

    async function loadHistoryConversation(conversationId) {
        try {
            const conv = await conversationStorage.getConversation(conversationId);

            if (!conv) {
                console.error('Conversation not found');
                return;
            }

            // Set as current conversation
            currentConversationId = conversationId;
            currentConversation = conv.messages || [];

            // Save current ID
            await conversationStorage.setCurrentConversationId(conversationId);

            // Update UI
            renderMessages();
            await updateHistoryList();
            hideHistory();

            elements.messageInput.focus();
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    async function deleteHistoryConversation(conversationId, title) {
        const confirmed = confirm(`Delete conversation "${title}"?\\n\\nThis cannot be undone.`);

        if (!confirmed) return;

        try {
            const success = await conversationStorage.deleteConversation(conversationId);

            if (success) {
                // If deleted current conversation, start new chat
                if (conversationId === currentConversationId) {
                    await startNewChat();
                }

                await updateHistoryList();
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    }

    function exportConversation(conversation) {
        // Export as Markdown
        const markdown = conversationStorage.exportToMarkdown(conversation);

        if (!markdown) {
            alert('Failed to export conversation');
            return;
        }

        // Create download link
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function clearAllHistory() {
        const confirmed = confirm('Delete ALL conversation history?\\n\\nThis cannot be undone and will delete all saved conversations.');

        if (!confirmed) return;

        try {
            const conversations = await conversationStorage.getAllConversations();

            for (const id of Object.keys(conversations)) {
                await conversationStorage.deleteConversation(id);
            }

            // Start fresh
            await startNewChat();
            await updateHistoryList();
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    // Search with debounce
    let searchTimeout = null;
    function handleHistorySearch(query) {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            updateHistoryList(query);
        }, 300);
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

        // History panel
        elements.historyBtn.addEventListener('click', showHistory);
        elements.closeHistoryBtn.addEventListener('click', hideHistory);
        elements.historySearchInput.addEventListener('input', (e) => {
            handleHistorySearch(e.target.value);
        });
        elements.clearHistoryBtn.addEventListener('click', clearAllHistory);

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                elements.messageInput.value = command + ' ';
                elements.messageInput.focus();
                autoResizeTextarea();
            });
        });

        // Image upload controls
        elements.imageAttachBtn.addEventListener('click', () => {
            elements.imageInput.click();
        });
        elements.imageInput.addEventListener('change', handleImageSelect);
        elements.screenshotBtn.addEventListener('click', captureScreenshot);

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
})();
