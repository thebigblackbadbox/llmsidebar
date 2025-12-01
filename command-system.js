// ========================
// Command System Module
// Handles slash commands and quick actions
// ========================

// ========================
// Command Registry
// ========================
class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.registerBuiltInCommands();
    }

    // Register a command
    register(name, config) {
        this.commands.set(name, {
            name,
            description: config.description || '',
            icon: config.icon || '⚡',
            requiresPageContent: config.requiresPageContent || false,
            handler: config.handler,
            aliases: config.aliases || []
        });
    }

    // Get command by name or alias
    get(name) {
        // Try direct match first
        if (this.commands.has(name)) {
            return this.commands.get(name);
        }

        // Try alias match
        for (const [cmdName, cmd] of this.commands) {
            if (cmd.aliases.includes(name)) {
                return cmd;
            }
        }

        return null;
    }

    // Get all commands
    getAll() {
        return Array.from(this.commands.values());
    }

    // Search commands by prefix
    search(prefix) {
        const lowerPrefix = prefix.toLowerCase();
        const results = [];

        for (const cmd of this.commands.values()) {
            // Match command name
            if (cmd.name.toLowerCase().startsWith(lowerPrefix)) {
                results.push(cmd);
                continue;
            }

            // Match aliases
            for (const alias of cmd.aliases) {
                if (alias.toLowerCase().startsWith(lowerPrefix)) {
                    results.push(cmd);
                    break;
                }
            }
        }

        return results;
    }

    // Register built-in commands
    registerBuiltInCommands() {
        // Summarize command
        this.register('summarize', {
            description: 'Summarize the current page or text',
            icon: '📝',
            requiresPageContent: true,
            aliases: ['sum', 'tldr'],
            handler: async (args, context) => {
                const pageContent = await context.getPageContent();
                if (!pageContent) {
                    return 'Unable to access page content. Please make sure you\'re on a valid webpage.';
                }

                return `Please provide a concise summary of this page in bullet points:\\n\\n[Page Context]\\nTitle: ${pageContent.title}\\nURL: ${pageContent.url}\\n\\nContent:\\n${pageContent.content}`;
            }
        });

        // Translate command
        this.register('translate', {
            description: 'Translate page or text to another language',
            icon: '🌐',
            requiresPageContent: false,
            aliases: ['trans'],
            handler: async (args, context) => {
                const targetLang = args.length > 0 ? args.join(' ') : 'English';
                const selectedText = context.selectedText;

                if (selectedText) {
                    return `Translate the following text to ${targetLang}:\\n\\n${selectedText}`;
                }

                const pageContent = await context.getPageContent();
                if (pageContent) {
                    return `Translate the main content of this page to ${targetLang}:\\n\\n[Page Content]\\n${pageContent.content.substring(0, 3000)}`;
                }

                return `Please provide the text you want to translate to ${targetLang}.`;
            }
        });

        // Explain command
        this.register('explain', {
            description: 'Explain technical concepts in simple terms',
            icon: '💡',
            requiresPageContent: false,
            aliases: ['eli5'],
            handler: async (args, context) => {
                if (args.length > 0) {
                    return `Explain "${args.join(' ')}" in simple, easy-to-understand terms as if explaining to a beginner.`;
                }

                const pageContent = await context.getPageContent();
                if (pageContent) {
                    return `Explain the main concepts on this page in simple terms:\\n\\n[Page: ${pageContent.title}]\\n${pageContent.content.substring(0, 2000)}`;
                }

                return 'What would you like me to explain?';
            }
        });

        // Code command
        this.register('code', {
            description: 'Activate expert coding mode',
            icon: '💻',
            requiresPageContent: false,
            aliases: ['dev', 'program'],
            handler: async (args, context) => {
                // This command sets a temporary system instruction
                const codePrompt = args.length > 0 ? args.join(' ') : 'Help me with coding';
                return `[CODING MODE ACTIVATED]\\n\\n${codePrompt}\\n\\n(Please provide clean, well-documented code with explanations. Focus on best practices and modern standards.)`;
            }
        });

        // Compare command (for multi-tab feature)
        this.register('compare', {
            description: 'Compare multiple tabs or texts',
            icon: '🔀',
            requiresPageContent: false,
            aliases: ['diff', 'contrast'],
            handler: async (args, context) => {
                // Will be enhanced when multi-tab feature is added
                return 'Please describe what you\'d like to compare. (Multi-tab comparison coming soon!)';
            }
        });

        // Clear command
        this.register('clear', {
            description: 'Clear current conversation',
            icon: '🗑️',
            requiresPageContent: false,
            aliases: ['reset', 'new'],
            handler: async (args, context) => {
                if (confirm('Start a new conversation? Current chat will be saved to history.')) {
                    await context.startNewChat();
                    return null; // Don't send a message
                }
                return null;
            }
        });

        // Export command
        this.register('export', {
            description: 'Export current conversation',
            icon: '💾',
            requiresPageContent: false,
            aliases: ['save', 'download'],
            handler: async (args, context) => {
                await context.exportCurrentConversation();
                return null; // Don't send a message
            }
        });

        // Help command
        this.register('help', {
            description: 'Show available commands',
            icon: '❓',
            requiresPageContent: false,
            aliases: ['commands', '?'],
            handler: async (args, context) => {
                const commands = this.getAll();
                let helpText = '**Available Commands:**\\n\\n';

                for (const cmd of commands) {
                    helpText += `${cmd.icon} **/${cmd.name}** - ${cmd.description}`;
                    if (cmd.aliases.length > 0) {
                        helpText += ` (aliases: /${cmd.aliases.join(', /')})`;
                    }
                    helpText += '\\n';
                }

                helpText += '\\n*Tip: Type / to see command suggestions*';
                return helpText;
            }
        });

        // Search command (future feature)
        this.register('search', {
            description: 'Search the web (coming soon)',
            icon: '🔍',
            requiresPageContent: false,
            handler: async (args, context) => {
                const query = args.join(' ');
                if (query) {
                    return `I'll search for: "${query}" (Web search integration coming soon!)`;
                }
                return 'What would you like to search for?';
            }
        });

        // Image command (for vision feature)
        this.register('image', {
            description: 'Analyze an image (coming soon)',
            icon: '🖼️',
            requiresPageContent: false,
            aliases: ['img', 'picture'],
            handler: async (args, context) => {
                return 'Image analysis feature coming soon! You\'ll be able to upload and analyze images.';
            }
        });
    }
}

// ========================
// Command Parser
// ========================
class CommandParser {
    constructor(registry) {
        this.registry = registry;
    }

    // Parse input text for commands
    parse(input) {
        const trimmedInput = input.trim();

        // Check if starts with slash
        if (!trimmedInput.startsWith('/')) {
            return { isCommand: false, input };
        }

        // Extract command and arguments
        const parts = trimmedInput.substring(1).split(/\\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Get command from registry
        const command = this.registry.get(commandName);

        if (!command) {
            return {
                isCommand: true,
                commandName,
                args,
                command: null,
                error: `Unknown command: /${commandName}. Type /help for available commands.`
            };
        }

        return {
            isCommand: true,
            commandName,
            args,
            command
        };
    }

    // Execute a command
    async execute(parsed, context) {
        if (!parsed.isCommand || !parsed.command) {
            throw new Error(parsed.error || 'Invalid command');
        }

        try {
            const result = await parsed.command.handler(parsed.args, context);
            return result;
        } catch (error) {
            console.error('Command execution error:', error);
            throw new Error(`Failed to execute command: ${error.message}`);
        }
    }
}

// ========================
// Command Autocomplete
// ========================
class CommandAutocomplete {
    constructor(registry, inputElement, onSelect) {
        this.registry = registry;
        this.inputElement = inputElement;
        this.onSelect = onSelect;
        this.dropdown = null;
        this.selectedIndex = -1;
        this.currentSuggestions = [];

        this.setupAutocomplete();
    }

    setupAutocomplete() {
        // Create dropdown element
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'command-autocomplete';
        this.dropdown.style.display = 'none';

        // Insert before input container
        this.inputElement.parentElement.parentElement.insertBefore(
            this.dropdown,
            this.inputElement.parentElement
        );

        // Listen for input events
        this.inputElement.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        // Listen for keyboard events
        this.inputElement.addEventListener('keydown', (e) => {
            if (this.dropdown.style.display === 'flex') {
                this.handleKeydown(e);
            }
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target) && e.target !== this.inputElement) {
                this.hide();
            }
        });
    }

    handleInput(value) {
        const trimmed = value.trim();

        // Only show if starts with /
        if (!trimmed.startsWith('/')) {
            this.hide();
            return;
        }

        // Extract command prefix (without /)
        const prefix = trimmed.substring(1).split(/\\s+/)[0];

        // If just "/", show all commands
        if (prefix === '') {
            this.currentSuggestions = this.registry.getAll();
        } else {
            // Search for matching commands
            this.currentSuggestions = this.registry.search(prefix);
        }

        if (this.currentSuggestions.length > 0) {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        this.dropdown.style.display = 'flex';
        this.render();
    }

    hide() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }

    render() {
        this.dropdown.innerHTML = '';

        this.currentSuggestions.forEach((cmd, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }

            item.innerHTML = `
                <span class="autocomplete-icon">${cmd.icon}</span>
                <div class="autocomplete-content">
                    <div class="autocomplete-name">/${cmd.name}</div>
                    <div class="autocomplete-description">${cmd.description}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectCommand(cmd);
            });

            this.dropdown.appendChild(item);
        });
    }

    handleKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(
                    this.selectedIndex + 1,
                    this.currentSuggestions.length - 1
                );
                this.render();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.render();
                break;

            case 'Tab':
            case 'Enter':
                if (this.selectedIndex >= 0 && e.key === 'Tab') {
                    e.preventDefault();
                    const cmd = this.currentSuggestions[this.selectedIndex];
                    this.selectCommand(cmd);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }

    selectCommand(cmd) {
        // Replace input with command
        this.inputElement.value = `/${cmd.name} `;
        this.inputElement.focus();
        this.hide();

        // Call callback if provided
        if (this.onSelect) {
            this.onSelect(cmd);
        }
    }
}

// Export singleton instances
const commandRegistry = new CommandRegistry();
const commandParser = new CommandParser(commandRegistry);
