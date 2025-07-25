const SolrService = require('./solr-service');

/**
 * Vocabulary API Controller
 * Provides high-level vocabulary management functions
 * Integrates Solr search with local database
 */
class VocabularyAPI {
  constructor() {
    this.solr = new SolrService();
    this.isInitialized = false;
  }

  /**
   * Initialize the API
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    try {
      this.isInitialized = await this.solr.isAvailable();
      if (!this.isInitialized) {
        console.warn('Solr is not available, some features may be limited');
      }
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize Vocabulary API:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get paginated vocabulary data
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (0-based, default: 0)
   * @param {number} options.size - Page size (default: 10)
   * @param {string} options.category - Filter by category/note
   * @param {string} options.sort - Sort field and order (default: 'word asc')
   * @returns {Promise<Object>} Paginated vocabulary data
   */
  async getVocabularyPaginated(options = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: []
      };
    }

    const {
      page = 0,
      size = 10,
      category = null,
      sort = 'id asc' // Use id for sorting since word is multivalued
    } = options;

    try {
      let filters = {};
      
      if (category) {
        filters.note = category;
      }

      const result = await this.solr.searchVocabulary({
        query: '*:*',
        rows: size,
        start: page * size,
        sort: 'id asc', // Use id for sorting since word is multivalued
        filters
      });

      if (result.success) {
        // Transform data for the learning app
        const vocabulary = result.data.map(doc => ({
          id: doc.id,
          english: Array.isArray(doc.word) ? doc.word[0] : doc.word,
          vietnamese: Array.isArray(doc.meaning_vi) ? doc.meaning_vi[0] : doc.meaning_vi,
          note: Array.isArray(doc.note) ? doc.note[0] : doc.note,
          allMeanings: doc.meaning_vi || [],
          allWords: doc.word || [],
          version: doc._version_
        }));

        return {
          success: true,
          data: vocabulary,
          pagination: {
            page: page,
            size: size,
            total: result.total,
            totalPages: Math.ceil(result.total / size),
            hasNext: (page + 1) * size < result.total,
            hasPrevious: page > 0
          }
        };
      }

      return result;
    } catch (error) {
      console.error('Get paginated vocabulary error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get vocabulary for learning session
   * @param {Object} options - Session options
   * @param {number} options.count - Number of words to get (default: 10)
   * @param {string} options.category - Filter by category/note
   * @param {string} options.difficulty - Filter by difficulty level
   * @param {boolean} options.random - Whether to get random words (default: true)
   * @returns {Promise<Object>} Vocabulary session data
   */
  async getVocabularySession(options = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: []
      };
    }

    const {
      count = 10,
      category = null,
      difficulty = null,
      random = true
    } = options;

    try {
      let filters = {};
      
      if (category) {
        filters.note = category;
      }
      
      if (difficulty) {
        filters.difficulty = difficulty;
      }

      let result;
      if (random) {
        result = await this.solr.getRandomVocabulary(count, filters);
      } else {
        result = await this.solr.searchVocabulary({
          query: '*:*',
          rows: count,
          filters
        });
      }

      if (result.success) {
        // Transform data for the learning app
        const vocabulary = result.data.map(doc => ({
          id: doc.id,
          english: Array.isArray(doc.word) ? doc.word[0] : doc.word,
          vietnamese: Array.isArray(doc.meaning_vi) ? doc.meaning_vi[0] : doc.meaning_vi,
          note: Array.isArray(doc.note) ? doc.note[0] : doc.note,
          allMeanings: doc.meaning_vi || [],
          allWords: doc.word || [],
          version: doc._version_
        }));

        return {
          success: true,
          data: vocabulary,
          total: result.total,
          sessionId: this.generateSessionId()
        };
      }

      return result;
    } catch (error) {
      console.error('Get vocabulary session error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Search vocabulary by text
   * @param {string} searchText - Text to search for
   * @param {Object} options - Search options
   * @param {number} options.limit - Maximum results to return
   * @param {string} options.searchType - 'both', 'english', or 'vietnamese'
   * @returns {Promise<Object>} Search results
   */
  async searchVocabulary(searchText, options = {}) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: []
      };
    }

    const {
      limit = 20,
      searchType = 'both'
    } = options;

    try {
      let query;
      const escapedText = this.escapeQuery(searchText);

      switch (searchType) {
        case 'english':
          query = `word:*${escapedText}*`;
          break;
        case 'vietnamese':
          query = `meaning_vi:*${escapedText}*`;
          break;
        case 'both':
        default:
          query = `word:*${escapedText}* OR meaning_vi:*${escapedText}*`;
          break;
      }

      const result = await this.solr.searchVocabulary({
        query,
        rows: limit,
        sort: '_score desc'
      });

      if (result.success) {
        const vocabulary = result.data.map(doc => ({
          id: doc.id,
          english: Array.isArray(doc.word) ? doc.word.join(', ') : doc.word,
          vietnamese: Array.isArray(doc.meaning_vi) ? doc.meaning_vi.join(', ') : doc.meaning_vi,
          note: Array.isArray(doc.note) ? doc.note.join(', ') : doc.note,
          allMeanings: doc.meaning_vi || [],
          allWords: doc.word || []
        }));

        return {
          success: true,
          data: vocabulary,
          total: result.total,
          query: searchText
        };
      }

      return result;
    } catch (error) {
      console.error('Search vocabulary error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get vocabulary by ID
   * @param {string} id - Vocabulary ID
   * @returns {Promise<Object>} Vocabulary entry
   */
  async getVocabularyById(id) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: null
      };
    }

    try {
      const result = await this.solr.getVocabularyById(id);
      
      if (result.success && result.data) {
        const doc = result.data;
        return {
          success: true,
          data: {
            id: doc.id,
            english: Array.isArray(doc.word) ? doc.word.join(', ') : doc.word,
            vietnamese: Array.isArray(doc.meaning_vi) ? doc.meaning_vi.join(', ') : doc.meaning_vi,
            note: Array.isArray(doc.note) ? doc.note.join(', ') : doc.note,
            allMeanings: doc.meaning_vi || [],
            allWords: doc.word || [],
            version: doc._version_
          }
        };
      }

      return result;
    } catch (error) {
      console.error('Get vocabulary by ID error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get vocabulary categories
   * @returns {Promise<Object>} Available categories
   */
  async getCategories() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: []
      };
    }

    try {
      const stats = await this.solr.getStatistics();
      
      if (stats.success) {
        return {
          success: true,
          data: stats.data.categories || []
        };
      }

      return stats;
    } catch (error) {
      console.error('Get categories error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Add new vocabulary entry
   * @param {Object} vocabulary - Vocabulary data
   * @param {string} vocabulary.english - English word/phrase
   * @param {string} vocabulary.vietnamese - Vietnamese meaning
   * @param {string} vocabulary.note - Category/note
   * @returns {Promise<Object>} Add result
   */
  async addVocabulary(vocabulary) {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available'
      };
    }

    try {
      const solrDoc = {
        id: vocabulary.id || this.generateId(),
        word: [vocabulary.english],
        meaning_vi: [vocabulary.vietnamese],
        note: [vocabulary.note || '']
      };

      const result = await this.solr.addVocabulary(solrDoc);
      
      if (result.success) {
        return {
          success: true,
          data: {
            id: result.data.id,
            english: vocabulary.english,
            vietnamese: vocabulary.vietnamese,
            note: vocabulary.note
          },
          message: 'Vocabulary added successfully'
        };
      }

      return result;
    } catch (error) {
      console.error('Add vocabulary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get vocabulary statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Solr service not available',
        data: { total: 0, categories: [] }
      };
    }

    try {
      return await this.solr.getStatistics();
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        success: false,
        error: error.message,
        data: { total: 0, categories: [] }
      };
    }
  }

  /**
   * Check if API is ready
   * @returns {boolean} True if API is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Escape special characters in search query
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeQuery(text) {
    return text.replace(/[+\-&|!(){}[\]^"~*?:\\]/g, '\\$&');
  }

  /**
   * Generate session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return require('crypto').randomUUID();
  }
}

module.exports = VocabularyAPI;
