// Renderer process script
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the app
    await initializeApp();
    setupEventListeners();
    addConsoleMessage('Application initialized successfully!');
});

async function initializeApp() {
    try {
        // Get app information
        const appVersion = await window.electronAPI.getAppVersion();
        const platform = window.electronAPI.platform;
        
        // Update UI with app info
        document.getElementById('app-version').textContent = appVersion;
        document.getElementById('platform').textContent = platform;
        document.getElementById('node-version').textContent = process.versions.node;
        document.getElementById('chrome-version').textContent = process.versions.chrome;
        
        addConsoleMessage(`App version: ${appVersion}`);
        addConsoleMessage(`Platform: ${platform}`);
        addConsoleMessage(`Node.js: ${process.versions.node}`);
        addConsoleMessage(`Chrome: ${process.versions.chrome}`);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        addConsoleMessage(`Error: ${error.message}`, 'error');
    }
}

function setupEventListeners() {
    // Button event listeners
    document.getElementById('new-file-btn').addEventListener('click', () => {
        addConsoleMessage('New file action triggered');
        // You can implement actual file creation logic here
    });
    
    document.getElementById('open-file-btn').addEventListener('click', () => {
        addConsoleMessage('Open file action triggered');
        // File opening is handled by the main process menu
    });
    
    document.getElementById('toggle-devtools-btn').addEventListener('click', () => {
        addConsoleMessage('DevTools toggle requested');
        // DevTools toggle is handled by the main process
    });
    
    document.getElementById('clear-console-btn').addEventListener('click', clearConsole);
    
    // Listen for menu events from main process
    window.electronAPI.onMenuNewFile(() => {
        addConsoleMessage('New lesson requested from menu');
        handleNewFile();
    });
    
    window.electronAPI.onMenuOpenFile((event, filePath) => {
        addConsoleMessage(`Vocabulary file opened from menu: ${filePath}`);
        handleOpenFile(filePath);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Window events
    window.addEventListener('beforeunload', () => {
        addConsoleMessage('Application is closing...');
    });
}

function handleKeyboardShortcuts(event) {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
            case 'n':
                event.preventDefault();
                addConsoleMessage('New lesson shortcut pressed');
                handleNewFile();
                break;
            case 'o':
                event.preventDefault();
                addConsoleMessage('Open vocabulary shortcut pressed');
                // File opening is handled by main process
                break;
            case 'i':
                if (event.shiftKey) {
                    event.preventDefault();
                    addConsoleMessage('DevTools shortcut pressed');
                }
                break;
        }
    }
}

function handleNewFile() {
    // Implement new lesson logic
    addConsoleMessage('Creating new lesson...');
    
    // Example: You could create a new lesson, clear content, etc.
    const timestamp = new Date().toLocaleTimeString();
    addConsoleMessage(`New lesson created at ${timestamp}`);
}

function handleOpenFile(filePath) {
    // Implement vocabulary file opening logic
    addConsoleMessage(`Processing vocabulary file: ${filePath}`);
    
    // Example: You could read the vocabulary file and display it
    // This would require implementing file reading in the main process
    addConsoleMessage(`Vocabulary loaded: ${filePath.split('/').pop()}`);
}

function addConsoleMessage(message, type = 'info') {
    const consoleOutput = document.getElementById('console-output');
    const timestamp = new Date().toLocaleTimeString();
    
    const messageElement = document.createElement('p');
    messageElement.style.margin = '0';
    messageElement.style.padding = '2px 0';
    
    switch (type) {
        case 'error':
            messageElement.style.color = '#ff6b6b';
            messageElement.textContent = `[${timestamp}] ERROR: ${message}`;
            break;
        case 'warning':
            messageElement.style.color = '#ffd93d';
            messageElement.textContent = `[${timestamp}] WARN: ${message}`;
            break;
        case 'success':
            messageElement.style.color = '#6bcf7f';
            messageElement.textContent = `[${timestamp}] SUCCESS: ${message}`;
            break;
        default:
            messageElement.style.color = '#00ff00';
            messageElement.textContent = `[${timestamp}] ${message}`;
    }
    
    consoleOutput.appendChild(messageElement);
    
    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Keep only last 100 messages to prevent memory issues
    while (consoleOutput.children.length > 100) {
        consoleOutput.removeChild(consoleOutput.firstChild);
    }
}

function clearConsole() {
    const consoleOutput = document.getElementById('console-output');
    consoleOutput.innerHTML = '<p style="color: #00ff00; margin: 0; padding: 2px 0;">Console cleared</p>';
    addConsoleMessage('Console cleared');
}

// Example API usage functions
async function demonstrateAPI() {
    try {
        const appPath = await window.electronAPI.getAppPath();
        addConsoleMessage(`App path: ${appPath}`);
    } catch (error) {
        addConsoleMessage(`API Error: ${error.message}`, 'error');
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body });
            }
        });
    }
}

// Export functions for potential use by other scripts
window.appUtils = {
    addConsoleMessage,
    clearConsole,
    demonstrateAPI,
    formatFileSize,
    showNotification
};
