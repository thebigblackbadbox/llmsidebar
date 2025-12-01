// ========================
// History Manager Module
// Handles conversation storage, retrieval, and search
// ========================

// Cross-browser compatibility
const browser = (() => {
    if (typeof window !== 'undefined') {
        return window.browser || window.chrome;
    }
    if (typeof self !== 'undefined') {
        return self.browser || self.chrome;
    }
    return globalThis.browser || globalThis.chrome;
})();

// ========================
// Conversation Storage Manager
// ========================
class ConversationStorage {
    constructor() {
        this.storageKey = 'conversations';
        this.currentIdKey = 'currentConversationId';
        this.settingsKey = 'historySettings';
    }

    // Generate unique ID
    generateId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get all conversations
    async getAllConversations() {
        try {
            const result = await browser.storage.local.get([this.storageKey]);
            return result[this.storageKey] || {};
        } catch (error) {
            console.error('Error getting conversations:', error);
            return {};
        }
    }

    // Get single conversation by ID
    async getConversation(id) {
        try {
            const conversations = await this.getAllConversations();
            return conversations[id] || null;
        } catch (error) {
            console.error('Error getting conversation:', error);
            return null;
        }
    }

    // Get current conversation ID
    async getCurrentConversationId() {
        try {
            const result = await browser.storage.local.get([this.currentIdKey]);
            return result[this.currentIdKey] || null;
        } catch (error) {
            console.error('Error getting current conversation ID:', error);
            return null;
        }
    }

    // Set current conversation ID
    async setCurrentConversationId(id) {
        try {
            await browser.storage.local.set({ [this.currentIdKey]: id });
            return true;
        } catch (error) {
            console.error('Error setting current conversation ID:', error);
            return false;
        }
    }

    // Create new conversation
    async createConversation(title = 'New Chat', messages = []) {
        try {
            const id = this.generateId();
            const now = Date.now();
            const conversation = {
                id,
                title,
                messages,
                createdAt: now,
                updatedAt: now,
                tags: []
            };

            const conversations = await this.getAllConversations();
            conversations[id] = conversation;

            await browser.storage.local.set({ [this.storageKey]: conversations });
            await this.setCurrentConversationId(id);

            return conversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    }

    // Update conversation
    async updateConversation(id, updates) {
        try {
            const conversations = await this.getAllConversations();

            if (!conversations[id]) {
                console.error('Conversation not found:', id);
                return false;
            }

            // Update fields
            conversations[id] = {
                ...conversations[id],
                ...updates,
                updatedAt: Date.now()
            };

            await browser.storage.local.set({ [this.storageKey]: conversations });
            return true;
        } catch (error) {
            console.error('Error updating conversation:', error);
            return false;
        }
    }

    // Delete conversation
    async deleteConversation(id) {
        try {
            const conversations = await this.getAllConversations();

            if (!conversations[id]) {
                return false;
            }

            delete conversations[id];
            await browser.storage.local.set({ [this.storageKey]: conversations });

            // If this was the current conversation, clear it
            const currentId = await this.getCurrentConversationId();
            if (currentId === id) {
                await this.setCurrentConversationId(null);
            }

            return true;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }
    }

    // Search conversations
    async searchConversations(query) {
        try {
            const conversations = await this.getAllConversations();
            const lowerQuery = query.toLowerCase();
            const results = [];

            for (const [id, conv] of Object.entries(conversations)) {
                // Search in title
                if (conv.title.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        ...conv,
                        matchType: 'title',
                        matchCount: 1
                    });
                    continue;
                }

                // Search in messages
                let matchCount = 0;
                const matchedMessages = [];

                for (const msg of conv.messages) {
                    if (msg.content.toLowerCase().includes(lowerQuery)) {
                        matchCount++;
                        matchedMessages.push({
                            role: msg.role,
                            content: msg.content,
                            timestamp: msg.timestamp
                        });
                    }
                }

                if (matchCount > 0) {
                    results.push({
                        ...conv,
                        matchType: 'messages',
                        matchCount,
                        matchedMessages
                    });
                }
            }

            // Sort by relevance (match count) and recency
            results.sort((a, b) => {
                if (a.matchCount !== b.matchCount) {
                    return b.matchCount - a.matchCount;
                }
                return b.updatedAt - a.updatedAt;
            });

            return results;
        } catch (error) {
            console.error('Error searching conversations:', error);
            return [];
        }
    }

    // Get conversations sorted by date
    async getConversationsSorted(sortBy = 'updatedAt', ascending = false) {
        try {
            const conversations = await this.getAllConversations();
            const convArray = Object.values(conversations);

            convArray.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                return ascending ? aVal - bVal : bVal - aVal;
            });

            return convArray;
        } catch (error) {
            console.error('Error getting sorted conversations:', error);
            return [];
        }
    }

    // Export conversation to JSON
    exportToJSON(conversation) {
        try {
            return JSON.stringify(conversation, null, 2);
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            return null;
        }
    }

    // Export conversation to Markdown
    exportToMarkdown(conversation) {
        try {
            let markdown = `# ${conversation.title}\n\n`;
            markdown += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
            markdown += `Last Updated: ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
            markdown += `---\n\n`;

            for (const msg of conversation.messages) {
                const time = new Date(msg.timestamp).toLocaleTimeString();
                const role = msg.role === 'user' ? '👤 You' : '🤖 Gemini';

                markdown += `## ${role} (${time})\n\n`;
                markdown += `${msg.content}\n\n`;
            }

            return markdown;
        } catch (error) {
            console.error('Error exporting to Markdown:', error);
            return null;
        }
    }

    // Import conversation from JSON
    async importFromJSON(jsonString) {
        try {
            const conversation = JSON.parse(jsonString);

            // Validate structure
            if (!conversation.title || !Array.isArray(conversation.messages)) {
                throw new Error('Invalid conversation format');
            }

            // Create new conversation with imported data
            return await this.createConversation(conversation.title, conversation.messages);
        } catch (error) {
            console.error('Error importing from JSON:', error);
            return null;
        }
    }

    // Generate smart title from first message
    generateSmartTitle(messages) {
        if (!messages || messages.length === 0) {
            return 'New Chat';
        }

        // Get first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (!firstUserMsg) {
            return 'New Chat';
        }

        // Truncate to ~50 chars
        let title = firstUserMsg.content.trim();

        // Remove line breaks
        title = title.replace(/\n+/g, ' ');

        // Truncate if too long
        if (title.length > 50) {
            title = title.substring(0, 47) + '...';
        }

        return title || 'New Chat';
    }

    // Migrate from old single-conversation format
    async migrateFromOldFormat() {
        try {
            // Check if old format exists
            const result = await browser.storage.local.get(['conversation']);

            if (!result.conversation || result.conversation.length === 0) {
                console.log('No old conversation to migrate');
                return false;
            }

            // Check if already migrated
            const existingConvs = await this.getAllConversations();
            if (Object.keys(existingConvs).length > 0) {
                console.log('Already migrated');
                return false;
            }

            console.log('Migrating conversation from old format...');

            // Create backup
            await browser.storage.local.set({ conversation_backup: result.conversation });

            // Create new conversation from old data
            const title = this.generateSmartTitle(result.conversation);
            const newConv = await this.createConversation(title, result.conversation);

            if (newConv) {
                console.log('Migration successful:', newConv.id);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error migrating conversation:', error);
            return false;
        }
    }

    // Clean up old conversations (keep last N)
    async cleanupOldConversations(keepCount = 100) {
        try {
            const convs = await this.getConversationsSorted('updatedAt', false);

            if (convs.length <= keepCount) {
                return 0;
            }

            const toDelete = convs.slice(keepCount);
            let deletedCount = 0;

            for (const conv of toDelete) {
                const success = await this.deleteConversation(conv.id);
                if (success) deletedCount++;
            }

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up conversations:', error);
            return 0;
        }
    }

    // Get storage usage info
    async getStorageInfo() {
        try {
            const conversations = await this.getAllConversations();
            const json = JSON.stringify(conversations);
            const bytes = new Blob([json]).size;
            const kb = (bytes / 1024).toFixed(2);
            const mb = (bytes / 1024 / 1024).toFixed(2);

            return {
                conversationCount: Object.keys(conversations).length,
                bytes,
                kb,
                mb,
                percentUsed: ((bytes / (5 * 1024 * 1024)) * 100).toFixed(2) // Assuming 5MB limit
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
}

// Export singleton instance
const conversationStorage = new ConversationStorage();

// Auto-migrate on load
conversationStorage.migrateFromOldFormat().catch(console.error);
