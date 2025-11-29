// Background service worker for the extension

// Cross-browser compatibility - Firefox uses 'browser', Chrome uses 'chrome'
const browser = (() => {
    if (typeof self !== 'undefined' && self.browser) {
        return self.browser;
    }
    if (typeof self !== 'undefined' && self.chrome) {
        return self.chrome;
    }
    return globalThis.browser || globalThis.chrome;
})();

// Initialize storage on install
browser.runtime.onInstalled.addListener(() => {
    console.log('Gemini AI Sidebar extension installed');

    // Initialize default settings
    browser.storage.local.get(['apiKey', 'selectedModel', 'conversation'], (result) => {
        if (!result.selectedModel) {
            browser.storage.local.set({ selectedModel: 'gemini-2.0-flash-exp' });
        }
        if (!result.conversation) {
            browser.storage.local.set({ conversation: [] });
        }
    });
});

// Handle keyboard shortcut command
browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-sidebar') {
        // Query the active tab
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            if (tabs[0]) {
                // Send message to content script to toggle sidebar
                browser.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar' })
                    .catch(err => console.log('Could not send message to tab:', err));
            }
        }).catch(err => {
            console.error('Error querying tabs:', err);
        });
    }
});

// Handle messages from popup/sidebar (if needed for future features)
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    sendResponse({ success: true });
    return true;
});
