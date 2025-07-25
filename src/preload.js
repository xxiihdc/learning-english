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
  
  // Database API
  database: {
    // Vocabulary operations
    addVocabulary: (word) => ipcRenderer.invoke('db-add-vocabulary', word),
    getVocabulary: (wordId) => ipcRenderer.invoke('db-get-vocabulary', wordId),
    getAllVocabulary: (options) => ipcRenderer.invoke('db-get-all-vocabulary', options),
    updateVocabulary: (wordId, updates) => ipcRenderer.invoke('db-update-vocabulary', wordId, updates),
    deleteVocabulary: (wordId) => ipcRenderer.invoke('db-delete-vocabulary', wordId),
    searchVocabulary: (query, options) => ipcRenderer.invoke('db-search-vocabulary', query, options),
    
    // Learning progress operations
    recordSession: (session) => ipcRenderer.invoke('db-record-session', session),
    getWordStats: (wordId) => ipcRenderer.invoke('db-get-word-stats', wordId),
    getProgress: (options) => ipcRenderer.invoke('db-get-progress', options),
    updateMastery: (wordId, masteryLevel) => ipcRenderer.invoke('db-update-mastery', wordId, masteryLevel),
    
    // Categories operations
    addCategory: (category) => ipcRenderer.invoke('db-add-category', category),
    getAllCategories: () => ipcRenderer.invoke('db-get-all-categories'),
    updateCategory: (categoryId, updates) => ipcRenderer.invoke('db-update-category', categoryId, updates),
    deleteCategory: (categoryId) => ipcRenderer.invoke('db-delete-category', categoryId),
    
    // Settings operations
    saveSetting: (key, value) => ipcRenderer.invoke('db-save-setting', key, value),
    getSetting: (key, defaultValue) => ipcRenderer.invoke('db-get-setting', key, defaultValue),
    getAllSettings: () => ipcRenderer.invoke('db-get-all-settings'),
    
    // Utility operations
    getStats: () => ipcRenderer.invoke('db-get-stats'),
    backup: (backupPath) => ipcRenderer.invoke('db-backup', backupPath),
    restore: (backupPath) => ipcRenderer.invoke('db-restore', backupPath),
    importVocabulary: (filePath, format) => ipcRenderer.invoke('db-import-vocabulary', filePath, format),
    exportVocabulary: (filePath, format, options) => ipcRenderer.invoke('db-export-vocabulary', filePath, format, options),
    healthCheck: () => ipcRenderer.invoke('db-health-check')
  },
  
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
