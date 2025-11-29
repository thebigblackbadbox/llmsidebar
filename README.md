# Gemini AI Sidebar Extension 🤖✨

A beautiful, modern browser extension that brings Google's Gemini AI to your browser as a **right-side slide-in sidebar** with a stunning ChatGPT-like interface. Features a dark theme with vibrant gradients, glassmorphism effects, and smooth animations. **Open with Alt+Shift+R!**

![Extension Preview](icons/icon128.png)

## ✨ Features

- **🎨 Premium Design**: Dark theme with vibrant purple-to-cyan gradients and glassmorphism effects
- **💬 ChatGPT-like Interface**: Familiar, intuitive chat experience
- **⌨️ Keyboard Shortcut**: Toggle sidebar instantly with **Alt+Shift+R**
- **📍 Right-Side Sidebar**: Slides in from the right, doesn't interfere with page content
- **🔄 Conversation Persistence**: Your chats are automatically saved
- ⚡ **Real-time Responses**: Streaming responses from Gemini AI
- 🌐 **Cross-Browser Compatible**: Works on Chrome, Firefox, Edge, and other browsers
- 🎯 **Latest Models**: Support for Gemini 2.0 Flash, Experimental 1206, and 1.5 Pro/Flash
- 📱 **Responsive**: Smooth animations and auto-scrolling messages
- 🔐 **Secure**: API key stored locally in your browser

## 🚀 Installation

### Chrome / Edge / Brave

1. Clone or download this repository
2. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Brave**: `brave://extensions/`
3. Enable **Developer Mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `Sidebar` folder from this project
6. The extension icon should appear in your browser toolbar!

### Firefox

1. Clone or download this repository
2. Open Firefox and navigate to: `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate to the `Sidebar` folder and select `manifest.json`
5. The extension will be loaded (note: it will be removed when Firefox closes)

## 🔑 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy your API key

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar
2. Click the ⚙️ (settings) icon in the top-right
3. Paste your Gemini API key
4. Select your preferred model (Gemini 1.5 Flash recommended for speed)
5. Click **Save Settings**

You're ready to chat! 🎉

## 💡 Usage

- **Open sidebar**: Press **Alt+Shift+R** on any webpage
- **Start chatting**: Type your message and press Enter or click the send button
- **New conversation**: Click the ✨ icon to start fresh
- **Close sidebar**: Press **Alt+Shift+R** again or click outside
- **Markdown support**: The AI's responses support basic markdown formatting
- **Multi-line messages**: Use Shift+Enter to add line breaks

## 🛠️ Technical Details

### Built With

- **Manifest V3**: Modern extension architecture
- **Vanilla JavaScript**: No frameworks, just pure JS
- **CSS Custom Properties**: Consistent, themeable design
- **Google Fonts (Inter)**: Clean, modern typography
- **Gemini API**: Powered by Google's latest AI models

### File Structure

```
Sidebar/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI structure
├── popup.js              # Core logic & API integration
├── sidebar.js            # Content script for sidebar injection
├── background.js         # Service worker
├── styles.css            # Complete design system
├── icons/                # Extension icons (16, 48, 128px)
└── README.md            # This file
```

### Browser Compatibility

The extension uses standard WebExtension APIs and is compatible with:
- ✅ Chrome (v88+)
- ✅ Edge (v88+)
- ✅ Firefox (v109+)
- ✅ Brave
- ✅ Opera
- ⚠️ Safari (requires minor adjustments)

## 🎨 Design Features

- **Dark Mode**: Easy on the eyes with carefully selected colors
- **Gradient Accents**: Purple (#9333EA) to Cyan (#06B6D4)
- **Glassmorphism**: Modern frosted glass effects
- **Smooth Animations**: Fade-ins, typing indicators, and transitions
- **Custom Scrollbar**: Styled to match the theme
- **Responsive Messages**: Auto-scroll and auto-resize textarea

## 🔒 Privacy & Security

- Your API key is stored **locally** in your browser using the Storage API
- No data is sent to any server except Google's Gemini API
- All conversations are stored locally on your device
- You can clear all data by removing the extension

## 🐛 Troubleshooting

**Extension won't load:**
- Make sure Developer Mode is enabled
- Check that all files are in the correct directory
- Look for errors in the browser's extension console

**API errors:**
- Verify your API key is correct and active
- Check your internet connection
- Ensure you haven't exceeded API quota limits
- Try a different model (Gemini 1.5 Flash is faster)

**Messages not saving:**
- Check browser storage permissions
- Try clearing extension data and reconfiguring

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 🙏 Acknowledgments

- Google Gemini API for the powerful AI capabilities
- Google Fonts for the beautiful Inter typeface
- The open-source community for inspiration

---

**Enjoy chatting with Gemini AI!** 🚀💜
