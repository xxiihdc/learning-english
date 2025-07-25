// Renderer process script

// Vocabulary data - will be loaded from database
let vocabularyData = [];
let currentCardIndex = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the app
    setupEventListeners();
    await loadVocabularyFromDatabase();
    setupFlipCard();
    console.log('Application initialized successfully!');
});

function setupEventListeners() {
    // Flip card event listeners
    document.getElementById('flip-card').addEventListener('click', flipCard);
    document.getElementById('flip-button').addEventListener('click', flipCard);
    document.getElementById('prev-card').addEventListener('click', () => {
        previousCard();
        console.log(`Switched to previous card: ${vocabularyData[currentCardIndex].word}`);
    });
    document.getElementById('next-card').addEventListener('click', () => {
        nextCard();
        console.log(`Switched to next card: ${vocabularyData[currentCardIndex].word}`);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(event) {
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

// Database Functions
async function loadVocabularyFromDatabase() {
    try {
        console.log('Loading vocabulary from database...');
        
        // Check database health first
        const isHealthy = await window.electronAPI.database.healthCheck();
        if (!isHealthy) {
            console.error('Database health check failed');
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
            
            console.log(`Loaded ${vocabularyData.length} words from database`);
        } else {
            console.log('No vocabulary found in database, using default words');
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
            console.log(`Recorded learning session for word: ${vocabularyData[currentCardIndex].word}`);
        }
    } catch (error) {
        console.error('Failed to record session:', error);
    }
}

// Flip Card Functions
function setupFlipCard() {
    if (vocabularyData.length === 0) {
        console.log('No vocabulary data available');
        return;
    }
    
    updateCardDisplay();
    updateProgressInfo();
    console.log('Flip card component initialized with database data');
}

function flipCard() {
    const flipCard = document.getElementById('flip-card');
    flipCard.classList.toggle('flipped');
    isFlipped = !isFlipped;
    
    if (isFlipped) {
        console.log(`Card flipped - showing meaning: ${vocabularyData[currentCardIndex].meaning}`);
    } else {
        console.log(`Card flipped - showing word: ${vocabularyData[currentCardIndex].word}`);
        
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
    // Flip card functions
    flipCard,
    nextCard,
    previousCard,
    setupFlipCard,
    // Database functions
    loadVocabularyFromDatabase,
    recordFlipCardSession
};
