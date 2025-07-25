// Renderer process script

// Vocabulary data - will be loaded from database
let vocabularyData = [];
let currentCardIndex = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the app
    await initializeApp();
    setupEventListeners();
    await loadVocabularyFromDatabase();
    setupFlipCard();
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
    
    // Database action buttons
    document.getElementById('reload-vocabulary-btn').addEventListener('click', async () => {
        await loadVocabularyFromDatabase();
        setupFlipCard();
        addConsoleMessage('Vocabulary reloaded from database');
    });
    
    document.getElementById('show-stats-btn').addEventListener('click', showDatabaseStats);
    
    document.getElementById('add-word-btn').addEventListener('click', addNewVocabularyWord);
    
    // Flip card event listeners
    document.getElementById('flip-card').addEventListener('click', flipCard);
    document.getElementById('flip-button').addEventListener('click', flipCard);
    document.getElementById('prev-card').addEventListener('click', () => {
        previousCard();
        addConsoleMessage(`Switched to previous card: ${vocabularyData[currentCardIndex].word}`);
    });
    document.getElementById('next-card').addEventListener('click', () => {
        nextCard();
        addConsoleMessage(`Switched to next card: ${vocabularyData[currentCardIndex].word}`);
    });
    
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
    
    // Flip card shortcuts
    switch (event.key) {
        case ' ': // Spacebar
        case 'Enter':
            event.preventDefault();
            flipCard();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            previousCard();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextCard();
            break;
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

// Database Functions
async function loadVocabularyFromDatabase() {
    try {
        addConsoleMessage('Loading vocabulary from database...');
        
        // Check database health first
        const isHealthy = await window.electronAPI.database.healthCheck();
        if (!isHealthy) {
            addConsoleMessage('Database health check failed', 'error');
            return;
        }

        // Load vocabulary from database
        const dbVocabulary = await window.electronAPI.database.getAllVocabulary();
        
        if (dbVocabulary && dbVocabulary.length > 0) {
            // Transform database format to flip card format
            vocabularyData = dbVocabulary.map(word => ({
                id: word.id,
                word: word.english,
                type: word.type,
                phonetic: word.phonetic,
                meaning: word.vietnamese,
                example: word.example,
                category: word.category,
                masteryLevel: word.masteryLevel || 0
            }));
            
            addConsoleMessage(`Loaded ${vocabularyData.length} words from database`);
        } else {
            addConsoleMessage('No vocabulary found in database, using default words');
            // Fallback to default words if database is empty
            vocabularyData = [
                {
                    word: "Hello",
                    type: "interjection",
                    phonetic: "/həˈloʊ/",
                    meaning: "Xin chào",
                    example: "\"Hello, how are you?\" - \"Xin chào, bạn khỏe không?\""
                }
            ];
        }
        
        // Reset card index if it's out of bounds
        if (currentCardIndex >= vocabularyData.length) {
            currentCardIndex = 0;
        }
        
    } catch (error) {
        console.error('Failed to load vocabulary from database:', error);
        addConsoleMessage(`Error loading vocabulary: ${error.message}`, 'error');
    }
}

async function recordFlipCardSession(correct, responseTime) {
    try {
        if (vocabularyData[currentCardIndex] && vocabularyData[currentCardIndex].id) {
            const session = {
                wordId: vocabularyData[currentCardIndex].id,
                correct: correct,
                responseTime: responseTime,
                sessionType: 'flashcard'
            };
            
            await window.electronAPI.database.recordSession(session);
            addConsoleMessage(`Recorded learning session for word: ${vocabularyData[currentCardIndex].word}`);
        }
    } catch (error) {
        console.error('Failed to record session:', error);
        addConsoleMessage(`Error recording session: ${error.message}`, 'error');
    }
}

async function addNewVocabularyWord() {
    try {
        // Example of adding a new word (you can create a form for this)
        const newWord = {
            english: "Example",
            vietnamese: "Ví dụ",
            type: "noun",
            phonetic: "/ɪɡˈzæmpəl/",
            example: "\"This is an example.\" - \"Đây là một ví dụ.\"",
            category: "Basic"
        };
        
        const wordId = await window.electronAPI.database.addVocabulary(newWord);
        addConsoleMessage(`Added new word with ID: ${wordId}`);
        
        // Reload vocabulary to include the new word
        await loadVocabularyFromDatabase();
        updateCardDisplay();
        updateProgressInfo();
        
    } catch (error) {
        console.error('Failed to add vocabulary:', error);
        addConsoleMessage(`Error adding vocabulary: ${error.message}`, 'error');
    }
}

async function showDatabaseStats() {
    try {
        const stats = await window.electronAPI.database.getStats();
        const progress = await window.electronAPI.database.getProgress();
        
        addConsoleMessage(`Database Stats: ${stats.vocabularyCount} words, ${stats.sessionsCount} sessions`);
        addConsoleMessage(`Learning Progress: ${(progress.overallAccuracy * 100).toFixed(1)}% accuracy`);
        
    } catch (error) {
        console.error('Failed to get database stats:', error);
        addConsoleMessage(`Error getting stats: ${error.message}`, 'error');
    }
}

// Flip Card Functions
function setupFlipCard() {
    if (vocabularyData.length === 0) {
        addConsoleMessage('No vocabulary data available');
        return;
    }
    
    updateCardDisplay();
    updateProgressInfo();
    addConsoleMessage('Flip card component initialized with database data');
}

function flipCard() {
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.toggle('flipped');
    isFlipped = !isFlipped;
    
    if (isFlipped) {
        addConsoleMessage(`Card flipped - showing meaning: ${vocabularyData[currentCardIndex].meaning}`);
    } else {
        addConsoleMessage(`Card flipped - showing word: ${vocabularyData[currentCardIndex].word}`);
        
        // Record session when user flips back to English (assuming they studied the meaning)
        recordFlipCardSession(true, 1000); // You can track actual time if needed
    }
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % vocabularyData.length;
    resetCard();
    updateCardDisplay();
    updateProgressInfo();
}

function previousCard() {
    currentCardIndex = (currentCardIndex - 1 + vocabularyData.length) % vocabularyData.length;
    resetCard();
    updateCardDisplay();
    updateProgressInfo();
}

function resetCard() {
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.remove('flipped');
    isFlipped = false;
}

function updateCardDisplay() {
    if (vocabularyData.length === 0) {
        // Show empty state
        document.getElementById('word-title').textContent = 'No words available';
        document.getElementById('word-type').textContent = '';
        document.getElementById('word-phonetic').textContent = '';
        document.getElementById('word-meaning').textContent = 'Load vocabulary first';
        document.getElementById('word-example').textContent = '';
        return;
    }
    
    const currentWord = vocabularyData[currentCardIndex];
    
    // Update front of card (English word)
    document.getElementById('word-title').textContent = currentWord.word;
    document.getElementById('word-type').textContent = currentWord.type;
    document.getElementById('word-phonetic').textContent = currentWord.phonetic;
    
    // Update back of card (Vietnamese meaning)
    document.getElementById('word-meaning').textContent = currentWord.meaning;
    document.getElementById('word-example').textContent = currentWord.example;
}

function updateProgressInfo() {
    const totalWords = vocabularyData.length || 1;
    const currentPosition = vocabularyData.length > 0 ? currentCardIndex + 1 : 0;
    document.getElementById('card-counter').textContent = `${currentPosition} / ${totalWords}`;
}

// Export functions for potential use by other scripts
window.appUtils = {
    addConsoleMessage,
    clearConsole,
    demonstrateAPI,
    formatFileSize,
    showNotification,
    // Flip card functions
    flipCard,
    nextCard,
    previousCard,
    setupFlipCard,
    // Database functions
    loadVocabularyFromDatabase,
    addNewVocabularyWord,
    showDatabaseStats,
    recordFlipCardSession
};
