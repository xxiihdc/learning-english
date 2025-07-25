const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const dbManager = require('./database/manager');
const VocabularyAPI = require('./api/vocabulary-api');

// Only require auto-updater in production builds
app.disableHardwareAcceleration();
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
  console.log('Auto-updater not available:', error.message);
}

// Keep a global reference of the window object
let mainWindow;

// Initialize Vocabulary API
const vocabularyAPI = new VocabularyAPI();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false // Don't show until ready-to-show
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (process.platform === 'darwin') {
      mainWindow.focus();
    }
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize database
  await initializeDatabase();
  
  // Initialize Vocabulary API
  await initializeVocabularyAPI();
  
  createWindow();
  createMenu();

  // On macOS, re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Check for updates
  if (!process.argv.includes('--dev') && autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', async () => {
  // Close database connection
  await dbManager.close();
  
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Handle new file
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize Database
async function initializeDatabase() {
  try {
    const success = await dbManager.initialize('json');
    if (success) {
      console.log('Database initialized successfully');
    } else {
      console.error('Failed to initialize database');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize Vocabulary API
async function initializeVocabularyAPI() {
  try {
    const success = await vocabularyAPI.initialize();
    if (success) {
      console.log('Vocabulary API initialized successfully with Solr');
    } else {
      console.log('Vocabulary API initialized in fallback mode (Solr not available)');
    }
  } catch (error) {
    console.error('Vocabulary API initialization error:', error);
  }
}

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// ==================== DATABASE IPC HANDLERS ====================

// Vocabulary handlers
ipcMain.handle('db-add-vocabulary', async (event, word) => {
  try {
    const db = dbManager.getDatabase();
    return await db.addVocabulary(word);
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-get-vocabulary', async (event, wordId) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getVocabularyById(wordId);
  } catch (error) {
    console.error('Error getting vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-get-all-vocabulary', async (event, options = {}) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getAllVocabulary(options);
  } catch (error) {
    console.error('Error getting all vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-update-vocabulary', async (event, wordId, updates) => {
  try {
    const db = dbManager.getDatabase();
    return await db.updateVocabulary(wordId, updates);
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-vocabulary', async (event, wordId) => {
  try {
    const db = dbManager.getDatabase();
    return await db.deleteVocabulary(wordId);
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-search-vocabulary', async (event, query, options = {}) => {
  try {
    const db = dbManager.getDatabase();
    return await db.searchVocabulary(query, options);
  } catch (error) {
    console.error('Error searching vocabulary:', error);
    throw error;
  }
});

// Learning progress handlers
ipcMain.handle('db-record-session', async (event, session) => {
  try {
    const db = dbManager.getDatabase();
    return await db.recordLearningSession(session);
  } catch (error) {
    console.error('Error recording session:', error);
    throw error;
  }
});

ipcMain.handle('db-get-word-stats', async (event, wordId) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getWordStatistics(wordId);
  } catch (error) {
    console.error('Error getting word stats:', error);
    throw error;
  }
});

ipcMain.handle('db-get-progress', async (event, options = {}) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getOverallProgress(options);
  } catch (error) {
    console.error('Error getting progress:', error);
    throw error;
  }
});

ipcMain.handle('db-update-mastery', async (event, wordId, masteryLevel) => {
  try {
    const db = dbManager.getDatabase();
    return await db.updateWordMastery(wordId, masteryLevel);
  } catch (error) {
    console.error('Error updating mastery:', error);
    throw error;
  }
});

// Categories handlers
ipcMain.handle('db-add-category', async (event, category) => {
  try {
    const db = dbManager.getDatabase();
    return await db.addCategory(category);
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
});

ipcMain.handle('db-get-all-categories', async (event) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getAllCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
});

ipcMain.handle('db-update-category', async (event, categoryId, updates) => {
  try {
    const db = dbManager.getDatabase();
    return await db.updateCategory(categoryId, updates);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-category', async (event, categoryId) => {
  try {
    const db = dbManager.getDatabase();
    return await db.deleteCategory(categoryId);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
});

// Settings handlers
ipcMain.handle('db-save-setting', async (event, key, value) => {
  try {
    const db = dbManager.getDatabase();
    return await db.saveSetting(key, value);
  } catch (error) {
    console.error('Error saving setting:', error);
    throw error;
  }
});

ipcMain.handle('db-get-setting', async (event, key, defaultValue = null) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getSetting(key, defaultValue);
  } catch (error) {
    console.error('Error getting setting:', error);
    throw error;
  }
});

ipcMain.handle('db-get-all-settings', async (event) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getAllSettings();
  } catch (error) {
    console.error('Error getting all settings:', error);
    throw error;
  }
});

// Utility handlers
ipcMain.handle('db-get-stats', async (event) => {
  try {
    const db = dbManager.getDatabase();
    return await db.getDatabaseStats();
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
});

ipcMain.handle('db-backup', async (event, backupPath) => {
  try {
    const db = dbManager.getDatabase();
    return await db.backup(backupPath);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
});

ipcMain.handle('db-restore', async (event, backupPath) => {
  try {
    const db = dbManager.getDatabase();
    return await db.restore(backupPath);
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
});

ipcMain.handle('db-import-vocabulary', async (event, filePath, format) => {
  try {
    const db = dbManager.getDatabase();
    return await db.importVocabulary(filePath, format);
  } catch (error) {
    console.error('Error importing vocabulary:', error);
    throw error;
  }
});

ipcMain.handle('db-export-vocabulary', async (event, filePath, format, options = {}) => {
  try {
    const db = dbManager.getDatabase();
    return await db.exportVocabulary(filePath, format, options);
  } catch (error) {
    console.error('Error exporting vocabulary:', error);
    throw error;
  }
});

// Database health check
ipcMain.handle('db-health-check', async (event) => {
  try {
    return dbManager.isHealthy();
  } catch (error) {
    console.error('Error checking database health:', error);
    return false;
  }
});

// ==================== SOLR/VOCABULARY API HANDLERS ====================

// Get paginated vocabulary data
ipcMain.handle('solr-get-vocabulary-paginated', async (event, options = {}) => {
  try {
    return await vocabularyAPI.getVocabularyPaginated(options);
  } catch (error) {
    console.error('Error getting paginated vocabulary:', error);
    throw error;
  }
});

// Get vocabulary for learning session
ipcMain.handle('solr-get-vocabulary-session', async (event, options = {}) => {
  try {
    return await vocabularyAPI.getVocabularySession(options);
  } catch (error) {
    console.error('Error getting vocabulary session:', error);
    throw error;
  }
});

// Search vocabulary
ipcMain.handle('solr-search-vocabulary', async (event, searchText, options = {}) => {
  try {
    return await vocabularyAPI.searchVocabulary(searchText, options);
  } catch (error) {
    console.error('Error searching vocabulary:', error);
    throw error;
  }
});

// Get vocabulary by ID
ipcMain.handle('solr-get-vocabulary-by-id', async (event, id) => {
  try {
    return await vocabularyAPI.getVocabularyById(id);
  } catch (error) {
    console.error('Error getting vocabulary by ID:', error);
    throw error;
  }
});

// Get vocabulary categories
ipcMain.handle('solr-get-categories', async (event) => {
  try {
    return await vocabularyAPI.getCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
});

// Add vocabulary
ipcMain.handle('solr-add-vocabulary', async (event, vocabulary) => {
  try {
    return await vocabularyAPI.addVocabulary(vocabulary);
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    throw error;
  }
});

// Get vocabulary statistics
ipcMain.handle('solr-get-statistics', async (event) => {
  try {
    return await vocabularyAPI.getStatistics();
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
});

// Check if Solr API is ready
ipcMain.handle('solr-is-ready', async (event) => {
  try {
    return vocabularyAPI.isReady();
  } catch (error) {
    console.error('Error checking Solr readiness:', error);
    return false;
  }
});

// Handle app protocol for deep linking (optional)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('learning-english', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('learning-english');
}
