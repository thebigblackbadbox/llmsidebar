// Content script that injects the sidebar into every page
// Cross-browser compatibility - window.browser for Firefox, chrome for Chrome
const browser = (() => {
    if (typeof window !== 'undefined' && window.browser) {
        return window.browser;
    }
    if (typeof window !== 'undefined' && window.chrome) {
        return window.chrome;
    }
    return globalThis.browser || globalThis.chrome;
})();

// Create sidebar container
let sidebarContainer = null;
let sidebarIframe = null;
let resizeHandle = null;
let isOpen = false;
let sidebarWidth = 420; // Default width
let isResizing = false;
let startX = 0;
let startWidth = 0;

// Load saved sidebar width
async function loadSidebarWidth() {
    try {
        const result = await browser.storage.local.get(['sidebarWidth']);
        if (result.sidebarWidth) {
            sidebarWidth = result.sidebarWidth;
        }
    } catch (error) {
        console.error('Error loading sidebar width:', error);
    }
}

// Save sidebar width
async function saveSidebarWidth() {
    try {
        await browser.storage.local.set({ sidebarWidth });
    } catch (error) {
        console.error('Error saving sidebar width:', error);
    }
}

// Create and inject sidebar
async function createSidebar() {
    if (sidebarContainer) return;

    // Load saved width first
    await loadSidebarWidth();

    // Create container
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'gemini-sidebar-container';
    sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    right: -${sidebarWidth}px;
    width: ${sidebarWidth}px;
    height: 100vh;
    z-index: 2147483647;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
  `;

    // Create resize handle
    resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    background: transparent;
    transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
  `;

    // Create iframe for isolation
    sidebarIframe = document.createElement('iframe');
    sidebarIframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: #0F0F1A;
  `;

    // Set iframe source to the popup HTML - use runtime.getURL for cross-browser support
    const popupUrl = browser.runtime.getURL('popup.html');
    sidebarIframe.src = popupUrl;

    sidebarContainer.appendChild(resizeHandle);
    sidebarContainer.appendChild(sidebarIframe);
    document.body.appendChild(sidebarContainer);

    // Setup resize functionality
    setupResizeHandler();
}

// Setup resize handler
function setupResizeHandler() {
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebarWidth;
        resizeHandle.classList.add('resizing');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaX = startX - e.clientX;
        let newWidth = startWidth + deltaX;

        // Constrain width between 300px and 800px
        newWidth = Math.max(300, Math.min(800, newWidth));

        sidebarWidth = newWidth;
        sidebarContainer.style.width = `${newWidth}px`;

        // Update position if open
        if (isOpen) {
            sidebarContainer.style.right = '0px';
            document.body.style.marginRight = `${newWidth}px`;
            adjustFixedElements(newWidth);
        } else {
            sidebarContainer.style.right = `-${newWidth}px`;
        }

        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            saveSidebarWidth();
        }
    });
}

// Toggle sidebar visibility
function toggleSidebar() {
    if (!sidebarContainer) {
        createSidebar();
    }

    isOpen = !isOpen;

    if (isOpen) {
        sidebarContainer.style.right = '0px';
        // Push page content to the left - only apply to body
        document.body.style.marginRight = `${sidebarWidth}px`;
        document.body.style.transition = 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        // Also handle fixed position elements that don't respect body margin
        adjustFixedElements(sidebarWidth);
    } else {
        sidebarContainer.style.right = `-${sidebarWidth}px`;
        // Restore page content
        document.body.style.marginRight = '0px';

        // Restore fixed elements
        adjustFixedElements(0);
    }
}

// Adjust fixed-position elements to account for sidebar
function adjustFixedElements(offset) {
    // Find all fixed position elements excluding our sidebar
    const allElements = document.querySelectorAll('*:not(#gemini-sidebar-container):not(#gemini-sidebar-container *)');

    allElements.forEach(element => {
        const style = window.getComputedStyle(element);

        // Only process truly fixed elements
        if (style.position === 'fixed') {
            const rect = element.getBoundingClientRect();

            // Check if element is actually at the right edge (within 50px)
            const isAtRightEdge = rect.right >= window.innerWidth - 50;

            // Check if element has explicit right positioning
            const hasRightPosition = style.right !== 'auto' && style.right !== '0px';

            if (offset > 0) {
                // Sidebar is opening - only adjust if element is at right edge with right positioning
                if (isAtRightEdge && hasRightPosition) {
                    // Store original right value if not already stored
                    if (!element.hasAttribute('data-gemini-original-right')) {
                        element.setAttribute('data-gemini-original-right', style.right);
                    }

                    const currentRight = parseInt(style.right) || 0;
                    element.style.transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.right = `${currentRight + offset}px`;
                }
            } else {
                // Sidebar is closing - restore original styles
                if (element.hasAttribute('data-gemini-original-right')) {
                    const originalRight = element.getAttribute('data-gemini-original-right');
                    element.style.right = originalRight;

                    // Clean up
                    element.removeAttribute('data-gemini-original-right');
                }
            }
        }
    });
}

// Get page content for AI analysis
function getPageContent() {
    try {
        // Get basic page info
        const title = document.title;
        const url = window.location.href;

        // Get meta description if available
        const metaDescription = document.querySelector('meta[name="description"]');
        const description = metaDescription ? metaDescription.getAttribute('content') : '';

        // Clone the body to avoid modifying the actual page
        const bodyClone = document.body.cloneNode(true);

        // Remove script, style, and sidebar elements
        const elementsToRemove = bodyClone.querySelectorAll('script, style, noscript, #gemini-sidebar-container');
        elementsToRemove.forEach(el => el.remove());

        // Get text content
        let textContent = bodyClone.innerText || bodyClone.textContent || '';

        // Clean up excessive whitespace
        textContent = textContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

        // Limit content length to avoid token limits (roughly 8000 chars ~ 2000 tokens)
        const maxLength = 8000;
        if (textContent.length > maxLength) {
            textContent = textContent.substring(0, maxLength) + '\n\n[Content truncated due to length...]';
        }

        return {
            title,
            url,
            description,
            content: textContent,
            success: true
        };
    } catch (error) {
        console.error('Error extracting page content:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Listen for toggle command from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSidebar') {
        toggleSidebar();
        sendResponse({ success: true });
    } else if (message.action === 'getPageContent') {
        const pageContent = getPageContent();
        sendResponse(pageContent);
    }
    return true; // Keep message channel open for async response
});

// Listen for messages from the popup iframe
window.addEventListener('message', (event) => {
    // Handle page content requests from the iframe
    if (event.data && event.data.type === 'requestPageContent') {
        const pageContent = getPageContent();

        // Send response back to iframe
        if (sidebarIframe && sidebarIframe.contentWindow) {
            sidebarIframe.contentWindow.postMessage({
                type: 'pageContentResponse',
                requestId: event.data.requestId,
                ...pageContent
            }, '*');
        }
    }

    // Handle screenshot capture requests
    if (event.data && event.data.type === 'captureScreenshot') {
        captureScreenshotForPopup(event.data.requestId);
    }
});

// Capture screenshot and send to popup
async function captureScreenshotForPopup(requestId) {
    try {
        // Get current tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
            sendScreenshotError(requestId, 'No active tab found');
            return;
        }

        // Capture visible tab
        const imageData = await browser.tabs.captureVisibleTab(null, { format: 'png' });

        // Send to iframe
        if (sidebarIframe && sidebarIframe.contentWindow) {
            sidebarIframe.contentWindow.postMessage({
                type: 'screenshotCaptured',
                requestId,
                success: true,
                imageData
            }, '*');
        }
    } catch (error) {
        console.error('Screenshot capture error:', error);
        sendScreenshotError(requestId, error.message);
    }
}

function sendScreenshotError(requestId, errorMessage) {
    if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage({
            type: 'screenshotCaptured',
            requestId,
            success: false,
            error: errorMessage
        }, '*');
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidebar);
} else {
    createSidebar();
}
