const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Menu events
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  
  // Example API methods - you can extend these
  showMessage: (message) => {
    console.log('Message from main process:', message);
  },
  
  // File operations (you can extend this)
  readFile: (filePath) => {
    // This would need to be implemented in main process
    return ipcRenderer.invoke('read-file', filePath);
  }
});

// Security: Remove any Node.js APIs from the window object
window.eval = global.eval = () => {
  throw new Error('Sorry, this app does not support window.eval().');
};
