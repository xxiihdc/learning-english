/**
 * Database Interface for Learning English App
 * 
 * This interface provides a consistent API for storing and retrieving
 * learning data regardless of the underlying database implementation.
 */

class DatabaseInterface {
    constructor() {
        this.isConnected = false;
        this.dbPath = null;
    }

    /**
     * Initialize the database connection
     * @param {string} dbPath - Path to the database file
     * @param {Object} options - Database configuration options
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(dbPath, options = {}) {
        throw new Error('initialize() method must be implemented by subclass');
    }

    /**
     * Close the database connection
     * @returns {Promise<void>}
     */
    async close() {
        throw new Error('close() method must be implemented by subclass');
    }

    // ==================== VOCABULARY METHODS ====================

    /**
     * Add a new vocabulary word
     * @param {Object} word - Word object
     * @param {string} word.english - English word
     * @param {string} word.vietnamese - Vietnamese translation
     * @param {string} word.type - Word type (noun, verb, etc.)
     * @param {string} word.phonetic - Phonetic pronunciation
     * @param {string} word.example - Example sentence
     * @param {string} word.category - Category/topic
     * @returns {Promise<number>} - Word ID
     */
    async addVocabulary(word) {
        throw new Error('addVocabulary() method must be implemented by subclass');
    }

    /**
     * Get vocabulary word by ID
     * @param {number} wordId - Word ID
     * @returns {Promise<Object|null>} - Word object or null
     */
    async getVocabularyById(wordId) {
        throw new Error('getVocabularyById() method must be implemented by subclass');
    }

    /**
     * Get all vocabulary words
     * @param {Object} options - Query options
     * @param {string} options.category - Filter by category
     * @param {number} options.limit - Limit results
     * @param {number} options.offset - Offset for pagination
     * @returns {Promise<Array>} - Array of word objects
     */
    async getAllVocabulary(options = {}) {
        throw new Error('getAllVocabulary() method must be implemented by subclass');
    }

    /**
     * Update vocabulary word
     * @param {number} wordId - Word ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateVocabulary(wordId, updates) {
        throw new Error('updateVocabulary() method must be implemented by subclass');
    }

    /**
     * Delete vocabulary word
     * @param {number} wordId - Word ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteVocabulary(wordId) {
        throw new Error('deleteVocabulary() method must be implemented by subclass');
    }

    /**
     * Search vocabulary words
     * @param {string} query - Search term
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Matching words
     */
    async searchVocabulary(query, options = {}) {
        throw new Error('searchVocabulary() method must be implemented by subclass');
    }

    // ==================== LEARNING PROGRESS METHODS ====================

    /**
     * Record learning session
     * @param {Object} session - Session data
     * @param {number} session.wordId - Word ID
     * @param {boolean} session.correct - Whether answer was correct
     * @param {number} session.responseTime - Time taken to respond (ms)
     * @param {string} session.sessionType - Type of learning session
     * @returns {Promise<number>} - Session ID
     */
    async recordLearningSession(session) {
        throw new Error('recordLearningSession() method must be implemented by subclass');
    }

    /**
     * Get learning statistics for a word
     * @param {number} wordId - Word ID
     * @returns {Promise<Object>} - Statistics object
     */
    async getWordStatistics(wordId) {
        throw new Error('getWordStatistics() method must be implemented by subclass');
    }

    /**
     * Get overall learning progress
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Progress statistics
     */
    async getOverallProgress(options = {}) {
        throw new Error('getOverallProgress() method must be implemented by subclass');
    }

    /**
     * Update word mastery level
     * @param {number} wordId - Word ID
     * @param {number} masteryLevel - New mastery level (0-5)
     * @returns {Promise<boolean>} - Success status
     */
    async updateWordMastery(wordId, masteryLevel) {
        throw new Error('updateWordMastery() method must be implemented by subclass');
    }

    // ==================== CATEGORIES METHODS ====================

    /**
     * Add a new category
     * @param {Object} category - Category object
     * @param {string} category.name - Category name
     * @param {string} category.description - Category description
     * @param {string} category.color - Category color
     * @returns {Promise<number>} - Category ID
     */
    async addCategory(category) {
        throw new Error('addCategory() method must be implemented by subclass');
    }

    /**
     * Get all categories
     * @returns {Promise<Array>} - Array of category objects
     */
    async getAllCategories() {
        throw new Error('getAllCategories() method must be implemented by subclass');
    }

    /**
     * Update category
     * @param {number} categoryId - Category ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} - Success status
     */
    async updateCategory(categoryId, updates) {
        throw new Error('updateCategory() method must be implemented by subclass');
    }

    /**
     * Delete category
     * @param {number} categoryId - Category ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteCategory(categoryId) {
        throw new Error('deleteCategory() method must be implemented by subclass');
    }

    // ==================== USER SETTINGS METHODS ====================

    /**
     * Save user setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<boolean>} - Success status
     */
    async saveSetting(key, value) {
        throw new Error('saveSetting() method must be implemented by subclass');
    }

    /**
     * Get user setting
     * @param {string} key - Setting key
     * @param {any} defaultValue - Default value if not found
     * @returns {Promise<any>} - Setting value
     */
    async getSetting(key, defaultValue = null) {
        throw new Error('getSetting() method must be implemented by subclass');
    }

    /**
     * Get all user settings
     * @returns {Promise<Object>} - Settings object
     */
    async getAllSettings() {
        throw new Error('getAllSettings() method must be implemented by subclass');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get database statistics
     * @returns {Promise<Object>} - Database stats
     */
    async getDatabaseStats() {
        throw new Error('getDatabaseStats() method must be implemented by subclass');
    }

    /**
     * Backup database
     * @param {string} backupPath - Path for backup file
     * @returns {Promise<boolean>} - Success status
     */
    async backup(backupPath) {
        throw new Error('backup() method must be implemented by subclass');
    }

    /**
     * Restore database from backup
     * @param {string} backupPath - Path to backup file
     * @returns {Promise<boolean>} - Success status
     */
    async restore(backupPath) {
        throw new Error('restore() method must be implemented by subclass');
    }

    /**
     * Import vocabulary from JSON/CSV
     * @param {string} filePath - Path to import file
     * @param {string} format - File format ('json' or 'csv')
     * @returns {Promise<Object>} - Import results
     */
    async importVocabulary(filePath, format) {
        throw new Error('importVocabulary() method must be implemented by subclass');
    }

    /**
     * Export vocabulary to JSON/CSV
     * @param {string} filePath - Path for export file
     * @param {string} format - File format ('json' or 'csv')
     * @param {Object} options - Export options
     * @returns {Promise<boolean>} - Success status
     */
    async exportVocabulary(filePath, format, options = {}) {
        throw new Error('exportVocabulary() method must be implemented by subclass');
    }
}

module.exports = DatabaseInterface;
