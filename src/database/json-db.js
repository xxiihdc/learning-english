const DatabaseInterface = require('./interface');
const fs = require('fs').promises;
const path = require('path');

/**
 * JSON File Database Implementation
 * Simple file-based storage for development and small-scale usage
 */
class JSONDatabase extends DatabaseInterface {
    constructor() {
        super();
        this.data = {
            vocabulary: [],
            categories: [],
            sessions: [],
            settings: {},
            metadata: {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
        this.nextIds = {
            vocabulary: 1,
            categories: 1,
            sessions: 1
        };
    }

    async initialize(dbPath, options = {}) {
        try {
            this.dbPath = dbPath;
            
            // Ensure directory exists
            const dir = path.dirname(dbPath);
            await fs.mkdir(dir, { recursive: true });

            // Load existing data if file exists
            try {
                const fileContent = await fs.readFile(dbPath, 'utf8');
                const loadedData = JSON.parse(fileContent);
                
                // Merge with default structure
                this.data = { ...this.data, ...loadedData };
                
                // Update next IDs based on existing data
                this.nextIds.vocabulary = Math.max(0, ...this.data.vocabulary.map(w => w.id || 0)) + 1;
                this.nextIds.categories = Math.max(0, ...this.data.categories.map(c => c.id || 0)) + 1;
                this.nextIds.sessions = Math.max(0, ...this.data.sessions.map(s => s.id || 0)) + 1;
                
            } catch (error) {
                // File doesn't exist or is invalid, start with empty data
                console.log('Creating new database file:', dbPath);
                await this.saveData();
            }

            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize JSON database:', error);
            return false;
        }
    }

    async close() {
        if (this.isConnected) {
            await this.saveData();
            this.isConnected = false;
        }
    }

    async saveData() {
        if (!this.dbPath) return false;
        
        try {
            this.data.metadata.lastModified = new Date().toISOString();
            await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Failed to save database:', error);
            return false;
        }
    }

    // ==================== VOCABULARY METHODS ====================

    async addVocabulary(word) {
        const newWord = {
            id: this.nextIds.vocabulary++,
            english: word.english,
            vietnamese: word.vietnamese,
            type: word.type || 'unknown',
            phonetic: word.phonetic || '',
            example: word.example || '',
            category: word.category || 'general',
            masteryLevel: 0,
            created: new Date().toISOString(),
            lastReviewed: null,
            reviewCount: 0
        };

        this.data.vocabulary.push(newWord);
        await this.saveData();
        return newWord.id;
    }

    async getVocabularyById(wordId) {
        return this.data.vocabulary.find(word => word.id === wordId) || null;
    }

    async getAllVocabulary(options = {}) {
        let result = [...this.data.vocabulary];

        // Filter by category
        if (options.category) {
            result = result.filter(word => word.category === options.category);
        }

        // Apply pagination
        if (options.offset) {
            result = result.slice(options.offset);
        }
        if (options.limit) {
            result = result.slice(0, options.limit);
        }

        return result;
    }

    async updateVocabulary(wordId, updates) {
        const wordIndex = this.data.vocabulary.findIndex(word => word.id === wordId);
        if (wordIndex === -1) return false;

        this.data.vocabulary[wordIndex] = {
            ...this.data.vocabulary[wordIndex],
            ...updates,
            id: wordId, // Ensure ID cannot be changed
            lastModified: new Date().toISOString()
        };

        await this.saveData();
        return true;
    }

    async deleteVocabulary(wordId) {
        const wordIndex = this.data.vocabulary.findIndex(word => word.id === wordId);
        if (wordIndex === -1) return false;

        this.data.vocabulary.splice(wordIndex, 1);
        await this.saveData();
        return true;
    }

    async searchVocabulary(query, options = {}) {
        const searchTerm = query.toLowerCase();
        return this.data.vocabulary.filter(word => 
            word.english.toLowerCase().includes(searchTerm) ||
            word.vietnamese.toLowerCase().includes(searchTerm) ||
            word.type.toLowerCase().includes(searchTerm) ||
            (word.example && word.example.toLowerCase().includes(searchTerm))
        );
    }

    // ==================== LEARNING PROGRESS METHODS ====================

    async recordLearningSession(session) {
        const newSession = {
            id: this.nextIds.sessions++,
            wordId: session.wordId,
            correct: session.correct,
            responseTime: session.responseTime,
            sessionType: session.sessionType || 'flashcard',
            timestamp: new Date().toISOString()
        };

        this.data.sessions.push(newSession);

        // Update word statistics
        const word = await this.getVocabularyById(session.wordId);
        if (word) {
            await this.updateVocabulary(session.wordId, {
                lastReviewed: new Date().toISOString(),
                reviewCount: (word.reviewCount || 0) + 1
            });
        }

        await this.saveData();
        return newSession.id;
    }

    async getWordStatistics(wordId) {
        const sessions = this.data.sessions.filter(s => s.wordId === wordId);
        const totalSessions = sessions.length;
        const correctSessions = sessions.filter(s => s.correct).length;
        const averageResponseTime = sessions.length > 0 
            ? sessions.reduce((sum, s) => sum + s.responseTime, 0) / sessions.length 
            : 0;

        return {
            totalSessions,
            correctSessions,
            accuracy: totalSessions > 0 ? correctSessions / totalSessions : 0,
            averageResponseTime,
            lastSession: sessions.length > 0 ? sessions[sessions.length - 1].timestamp : null
        };
    }

    async getOverallProgress(options = {}) {
        const totalWords = this.data.vocabulary.length;
        const totalSessions = this.data.sessions.length;
        const correctSessions = this.data.sessions.filter(s => s.correct).length;
        const masteredWords = this.data.vocabulary.filter(w => w.masteryLevel >= 4).length;

        return {
            totalWords,
            masteredWords,
            totalSessions,
            correctSessions,
            overallAccuracy: totalSessions > 0 ? correctSessions / totalSessions : 0,
            masteryPercentage: totalWords > 0 ? masteredWords / totalWords : 0
        };
    }

    async updateWordMastery(wordId, masteryLevel) {
        return await this.updateVocabulary(wordId, { masteryLevel });
    }

    // ==================== CATEGORIES METHODS ====================

    async addCategory(category) {
        const newCategory = {
            id: this.nextIds.categories++,
            name: category.name,
            description: category.description || '',
            color: category.color || '#3b82f6',
            created: new Date().toISOString()
        };

        this.data.categories.push(newCategory);
        await this.saveData();
        return newCategory.id;
    }

    async getAllCategories() {
        return [...this.data.categories];
    }

    async updateCategory(categoryId, updates) {
        const categoryIndex = this.data.categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex === -1) return false;

        this.data.categories[categoryIndex] = {
            ...this.data.categories[categoryIndex],
            ...updates,
            id: categoryId,
            lastModified: new Date().toISOString()
        };

        await this.saveData();
        return true;
    }

    async deleteCategory(categoryId) {
        const categoryIndex = this.data.categories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex === -1) return false;

        this.data.categories.splice(categoryIndex, 1);
        await this.saveData();
        return true;
    }

    // ==================== USER SETTINGS METHODS ====================

    async saveSetting(key, value) {
        this.data.settings[key] = value;
        await this.saveData();
        return true;
    }

    async getSetting(key, defaultValue = null) {
        return this.data.settings[key] !== undefined ? this.data.settings[key] : defaultValue;
    }

    async getAllSettings() {
        return { ...this.data.settings };
    }

    // ==================== UTILITY METHODS ====================

    async getDatabaseStats() {
        return {
            vocabularyCount: this.data.vocabulary.length,
            categoriesCount: this.data.categories.length,
            sessionsCount: this.data.sessions.length,
            settingsCount: Object.keys(this.data.settings).length,
            databaseSize: JSON.stringify(this.data).length,
            created: this.data.metadata.created,
            lastModified: this.data.metadata.lastModified
        };
    }

    async backup(backupPath) {
        try {
            await fs.copyFile(this.dbPath, backupPath);
            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            return false;
        }
    }

    async restore(backupPath) {
        try {
            await fs.copyFile(backupPath, this.dbPath);
            return await this.initialize(this.dbPath);
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }

    async importVocabulary(filePath, format) {
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            let words = [];

            if (format === 'json') {
                words = JSON.parse(fileContent);
            } else if (format === 'csv') {
                // Simple CSV parsing (you might want to use a proper CSV library)
                const lines = fileContent.split('\n').slice(1); // Skip header
                words = lines.map(line => {
                    const [english, vietnamese, type, phonetic, example, category] = line.split(',');
                    return { english, vietnamese, type, phonetic, example, category };
                });
            }

            let imported = 0;
            for (const word of words) {
                if (word.english && word.vietnamese) {
                    await this.addVocabulary(word);
                    imported++;
                }
            }

            return { imported, total: words.length };
        } catch (error) {
            console.error('Import failed:', error);
            return { imported: 0, total: 0, error: error.message };
        }
    }

    async exportVocabulary(filePath, format, options = {}) {
        try {
            const words = await this.getAllVocabulary(options);
            let content = '';

            if (format === 'json') {
                content = JSON.stringify(words, null, 2);
            } else if (format === 'csv') {
                const header = 'English,Vietnamese,Type,Phonetic,Example,Category\n';
                const rows = words.map(word => 
                    `"${word.english}","${word.vietnamese}","${word.type}","${word.phonetic}","${word.example}","${word.category}"`
                ).join('\n');
                content = header + rows;
            }

            await fs.writeFile(filePath, content, 'utf8');
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }
}

module.exports = JSONDatabase;
