const path = require('path');
const { app } = require('electron');
const JSONDatabase = require('./json-db');

/**
 * Database Manager
 * Handles database initialization and provides a singleton instance
 */
class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbType = 'json'; // Default to JSON database
        this.isInitialized = false;
    }

    /**
     * Initialize the database
     * @param {string} dbType - Database type ('json', 'sqlite', etc.)
     * @param {Object} options - Database options
     */
    async initialize(dbType = 'json', options = {}) {
        try {
            this.dbType = dbType;

            // Get database path
            const dbPath = options.dbPath || this.getDefaultDatabasePath(dbType);

            // Create database instance based on type
            switch (dbType) {
                case 'json':
                    this.db = new JSONDatabase();
                    break;
                case 'sqlite':
                    // TODO: Implement SQLite database
                    throw new Error('SQLite database not implemented yet');
                default:
                    throw new Error(`Unsupported database type: ${dbType}`);
            }

            // Initialize the database
            const success = await this.db.initialize(dbPath, options);
            if (!success) {
                throw new Error('Failed to initialize database');
            }

            this.isInitialized = true;
            console.log(`Database initialized: ${dbType} at ${dbPath}`);

            // Initialize with default data if empty
            await this.initializeDefaultData();

            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Get default database path based on type
     */
    getDefaultDatabasePath(dbType) {
        const userDataPath = app.getPath('userData');
        const dbFileName = dbType === 'json' ? 'learning-english.json' : 'learning-english.db';
        return path.join(userDataPath, 'data', dbFileName);
    }

    /**
     * Initialize database with default categories and sample data
     */
    async initializeDefaultData() {
        if (!this.db) return;

        try {
            // Check if we already have categories
            const categories = await this.db.getAllCategories();
            if (categories.length === 0) {
                // Add default categories
                await this.db.addCategory({
                    name: 'Basic',
                    description: 'Basic everyday vocabulary',
                    color: '#3b82f6'
                });
                await this.db.addCategory({
                    name: 'Travel',
                    description: 'Travel and transportation related words',
                    color: '#10b981'
                });
                await this.db.addCategory({
                    name: 'Food',
                    description: 'Food and dining vocabulary',
                    color: '#f59e0b'
                });
                await this.db.addCategory({
                    name: 'Work',
                    description: 'Professional and workplace terms',
                    color: '#8b5cf6'
                });
                await this.db.addCategory({
                    name: 'Family',
                    description: 'Family and relationships',
                    color: '#ef4444'
                });
            }

            // Check if we need to add default vocabulary
            const vocabulary = await this.db.getAllVocabulary();
            if (vocabulary.length === 0) {
                // Add some sample vocabulary
                const sampleWords = [
                    {
                        english: "Hello",
                        vietnamese: "Xin chào",
                        type: "interjection",
                        phonetic: "/həˈloʊ/",
                        example: "\"Hello, how are you?\" - \"Xin chào, bạn khỏe không?\"",
                        category: "Basic"
                    },
                    {
                        english: "Thank you",
                        vietnamese: "Cảm ơn",
                        type: "phrase",
                        phonetic: "/θæŋk juː/",
                        example: "\"Thank you for your help.\" - \"Cảm ơn bạn đã giúp đỡ.\"",
                        category: "Basic"
                    },
                    {
                        english: "Beautiful",
                        vietnamese: "Đẹp",
                        type: "adjective",
                        phonetic: "/ˈbjuːtɪfəl/",
                        example: "\"She has a beautiful smile.\" - \"Cô ấy có nụ cười đẹp.\"",
                        category: "Basic"
                    }
                ];

                for (const word of sampleWords) {
                    await this.db.addVocabulary(word);
                }
            }

            // Initialize default settings
            const settings = await this.db.getAllSettings();
            if (Object.keys(settings).length === 0) {
                await this.db.saveSetting('theme', 'light');
                await this.db.saveSetting('language', 'en');
                await this.db.saveSetting('autoPlay', true);
                await this.db.saveSetting('showPhonetic', true);
                await this.db.saveSetting('cardsPerSession', 10);
            }

        } catch (error) {
            console.error('Failed to initialize default data:', error);
        }
    }

    /**
     * Get database instance
     */
    getDatabase() {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        if (!this.db) return null;
        return await this.db.getDatabaseStats();
    }

    /**
     * Health check
     */
    isHealthy() {
        return this.isInitialized && this.db && this.db.isConnected;
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
