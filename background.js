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

// Handle messages from popup/sidebar
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);

    // Handle tab management operations
    if (request.action === 'list_tabs') {
        browser.tabs.query({}).then(tabs => {
            sendResponse({
                success: true,
                tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active, windowId: t.windowId }))
            });
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'switch_tab') {
        const query = request.query;

        (async () => {
            try {
                let tabId = query;
                let windowId = null;

                // If query is a string and not a number, search for the tab
                if (typeof query === 'string' && isNaN(parseInt(query))) {
                    const tabs = await browser.tabs.query({});
                    const match = tabs.find(t =>
                        (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
                        (t.url && t.url.toLowerCase().includes(query.toLowerCase()))
                    );
                    if (match) {
                        tabId = match.id;
                        windowId = match.windowId;
                    } else {
                        sendResponse({ success: false, error: `No tab found matching "${query}"` });
                        return;
                    }
                } else {
                    tabId = parseInt(query);
                    // Get the tab to find its windowId
                    try {
                        const tab = await browser.tabs.get(tabId);
                        windowId = tab.windowId;
                    } catch (e) {
                        sendResponse({ success: false, error: `Tab ${tabId} not found` });
                        return;
                    }
                }

                // Focus the window first if we know it
                if (windowId && browser.windows) {
                    try {
                        console.log(`[BG] Focusing window ${windowId} for tab ${tabId}`);
                        await browser.windows.update(windowId, { focused: true });
                    } catch (e) {
                        console.error('Error focusing window:', e);
                    }
                }

                // Switch the tab
                console.log(`[BG] Activating tab ${tabId}`);
                await browser.tabs.update(tabId, { active: true });

                // Wait a brief moment to ensure state propagation (helps with subsequent reload calls)
                await new Promise(resolve => setTimeout(resolve, 100));

                sendResponse({ success: true, tabId });
            } catch (err) {
                console.error('[BG] Error in switch_tab:', err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep channel open for async response
    }

    if (request.action === 'close_tab') {
        const query = request.query;

        (async () => {
            try {
                let tabsToClose = [];

                // If query is a string and not a number, search for ALL matching tabs
                if (typeof query === 'string' && isNaN(parseInt(query))) {
                    const tabs = await browser.tabs.query({});
                    const matches = tabs.filter(t =>
                        (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
                        (t.url && t.url.toLowerCase().includes(query.toLowerCase()))
                    );

                    if (matches.length > 0) {
                        tabsToClose = matches.map(t => t.id);
                    } else {
                        sendResponse({ success: false, error: `No tabs found matching "${query}"` });
                        return;
                    }
                } else {
                    // Single ID
                    tabsToClose = [parseInt(query)];
                }

                console.log(`[BG] Closing ${tabsToClose.length} tabs matching "${query}"`);

                // Close the tabs
                await browser.tabs.remove(tabsToClose);
                sendResponse({ success: true, count: tabsToClose.length, tabIds: tabsToClose });
            } catch (err) {
                console.error('[BG] Error in close_tab:', err);
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep channel open for async response
    }

    if (request.action === 'close_current_tab') {
        (async () => {
            try {
                // Get the last focused window
                const currentWindow = await browser.windows.getLastFocused();
                // Query tabs in that window
                const tabs = await browser.tabs.query({ windowId: currentWindow.id });
                // Find the active tab
                const activeTab = tabs.find(t => t.active);

                if (activeTab) {
                    console.log('🔴 [BG] Closing current tab:', activeTab.id, activeTab.title);
                    await browser.tabs.remove(activeTab.id);
                    sendResponse({ success: true, tabId: activeTab.id });
                } else {
                    sendResponse({ success: false, error: 'No active tab found' });
                }
            } catch (err) {
                console.error('🔴 [BG] Error closing current tab:', err);
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true; // Keep channel open for async response
    }

    if (request.action === 'reload_current_tab') {
        (async () => {
            try {
                // Get the last focused window
                const currentWindow = await browser.windows.getLastFocused();
                // Query tabs in that window
                const tabs = await browser.tabs.query({ windowId: currentWindow.id });
                // Find the active tab
                const activeTab = tabs.find(t => t.active);

                if (activeTab) {
                    console.log('🔄 [BG] Reloading current tab:', activeTab.id, activeTab.title);
                    await browser.tabs.reload(activeTab.id);
                    sendResponse({ success: true, tabId: activeTab.id });
                } else {
                    sendResponse({ success: false, error: 'No active tab found' });
                }
            } catch (err) {
                console.error('🔄 [BG] Error reloading current tab:', err);
                sendResponse({ success: false, error: err.message });
            }
        })();
        return true; // Keep channel open for async response
    }

    if (request.action === 'reload_tab') {
        const query = request.query;

        (async () => {
            try {
                let tabId = query;

                // If query is a string and not a number, search for the tab
                if (typeof query === 'string' && isNaN(parseInt(query))) {
                    const tabs = await browser.tabs.query({});
                    const match = tabs.find(t =>
                        (t.title && t.title.toLowerCase().includes(query.toLowerCase())) ||
                        (t.url && t.url.toLowerCase().includes(query.toLowerCase()))
                    );
                    if (match) {
                        tabId = match.id;
                    } else {
                        sendResponse({ success: false, error: `No tab found matching "${query}"` });
                        return;
                    }
                } else {
                    tabId = parseInt(query);
                }

                // Reload the tab
                await browser.tabs.reload(tabId);
                sendResponse({ success: true, tabId });
            } catch (err) {
                sendResponse({ success: false, error: err.message });
            }
        })();

        return true; // Keep channel open for async response
    }

    if (request.action === 'group_tabs') {
        const tabIds = request.tabIds;
        const groupName = request.name;

        // Check if browser supports tab groups (Chromium only)
        if (browser.tabGroups) {
            (async () => {
                try {
                    const groupId = await browser.tabs.group({ tabIds });
                    if (groupName && groupId) {
                        await browser.tabGroups.update(groupId, { title: groupName });
                    }
                    sendResponse({ success: true, groupId });
                } catch (err) {
                    sendResponse({ success: false, error: err.message });
                }
            })();
        } else {
            sendResponse({ success: false, error: 'Tab groups not supported in this browser' });
        }

        return true; // Keep channel open for async response
    }

    sendResponse({ success: true });
    return true;
});
