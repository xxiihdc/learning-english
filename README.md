# Learning English

An interactive Electron desktop application designed for English language learning with modern UI and cross-platform support.

## Features

- ✅ **Interactive Learning** - Engaging English learning exercises and activities
- ✅ **Vocabulary Builder** - Tools for expanding English vocabulary
- ✅ **Grammar Practice** - Interactive grammar exercises and lessons
- ✅ **Progress Tracking** - Monitor learning progress and achievements
- ✅ **Offline Capable** - Learn English without internet connection
- ✅ **Cross-platform** - Works on Windows, macOS, and Linux

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

Or run in development mode with DevTools:
```bash
npm run dev
```

## Scripts

- `npm start` - Start the application
- `npm run dev` - Start with development tools enabled
- `npm run build` - Build for all platforms
- `npm run build:mac` - Build for macOS
- `npm run build:win` - Build for Windows
- `npm run build:linux` - Build for Linux
- `npm run pack` - Package without creating installer
- `npm run dist` - Create distribution packages

## Project Structure

```
src/
├── main.js          # Main process (Electron app entry point)
├── preload.js       # Preload script (secure bridge between main and renderer)
├── index.html       # Main window HTML
├── styles.css       # Application styles
└── renderer.js      # Renderer process script

assets/
└── icon.png         # Application icon (you need to add this)

package.json         # Project configuration and dependencies
README.md           # This file
```

## Security Features

This boilerplate implements several security best practices:

- **Context Isolation**: Enabled for all windows
- **Node Integration**: Disabled in renderer processes
- **Remote Module**: Disabled
- **Content Security Policy**: Implemented in HTML
- **Secure Preload**: Only exposes necessary APIs to renderer

## Building for Distribution

The app is configured to build for multiple platforms:

### macOS
```bash
npm run build:mac
```
Creates a `.dmg` file in the `dist` folder.

### Windows
```bash
npm run build:win
```
Creates an NSIS installer in the `dist` folder.

### Linux
```bash
npm run build:linux
```
Creates an AppImage in the `dist` folder.

## Adding an Application Icon

1. Create an icon file (preferably 512x512 PNG)
2. Save it as `assets/icon.png`
3. For platform-specific icons:
   - **macOS**: Add `assets/icon.icns`
   - **Windows**: Add `assets/icon.ico`
   - **Linux**: Use PNG format

## Customization

### Changing App Details

Edit `package.json`:
```json
{
  "name": "learning-english",
  "productName": "Learning English",
  "description": "An interactive English learning desktop application",
  "author": "Your Name"
}
```

### Window Configuration

Edit `src/main.js` in the `createWindow()` function:
```javascript
mainWindow = new BrowserWindow({
  width: 1200,        // Change window width
  height: 800,        // Change window height
  minWidth: 800,      // Minimum width
  minHeight: 600,     // Minimum height
  // ... other options
});
```

### Adding New Features

1. **Main Process**: Add functionality in `src/main.js`
2. **Renderer Process**: Add UI and logic in `src/renderer.js`
3. **IPC Communication**: Use the preload script (`src/preload.js`) for secure communication

## Development Tips

1. **Hot Reload**: Restart the app when you make changes to the main process
2. **DevTools**: Use `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS) to open DevTools
3. **Debugging**: Console logs in the renderer process appear in DevTools
4. **Main Process Debugging**: Use `console.log()` in main.js - output appears in terminal

## Common Issues

### App Won't Start
- Check that all dependencies are installed: `npm install`
- Verify Node.js version (v16+)
- Check for syntax errors in main.js

### Build Issues
- Ensure you have the necessary build tools for your platform
- Check that all required assets (like icons) are present
- Verify the build configuration in package.json

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Security Best Practices](https://www.electronjs.org/docs/tutorial/security)

## License

MIT License - see LICENSE file for details.
