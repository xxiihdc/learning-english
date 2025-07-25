const axios = require('axios');

/**
 * Solr API service for vocabulary management
 * Handles communication with Apache Solr server
 */
class SolrService {
  constructor(baseUrl = 'http://localhost:8983', coreName = 'vocabulary') {
    this.baseUrl = baseUrl;
    this.coreName = coreName;
    this.solrUrl = `${baseUrl}/solr/${coreName}`;
  }

  /**
   * Search vocabulary entries
   * @param {Object} options - Search options
   * @param {string} options.query - Search query (defaults to *:* for all)
   * @param {number} options.rows - Number of results to return (default: 10)
   * @param {number} options.start - Starting offset (default: 0)
   * @param {string} options.sort - Sort field and order (e.g., 'word asc')
   * @param {Array<string>} options.fields - Specific fields to return
   * @param {Object} options.filters - Filter queries
   * @returns {Promise<Object>} Search results
   */
  async searchVocabulary(options = {}) {
    try {
      const {
        query = '*:*',
        rows = 10,
        start = 0,
        sort = 'word asc',
        fields = ['*'],
        filters = {}
      } = options;

      const params = {
        q: query,
        rows,
        start,
        sort,
        fl: fields.join(','),
        wt: 'json'
      };

      // Add filter queries
      if (Object.keys(filters).length > 0) {
        params.fq = Object.entries(filters).map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}:(${value.map(v => `"${v}"`).join(' OR ')})`;
          }
          return `${field}:"${value}"`;
        });
      }

      const response = await axios.get(`${this.solrUrl}/select`, { params });
      
      return {
        success: true,
        data: response.data.response.docs,
        total: response.data.response.numFound,
        start: response.data.response.start,
        query: query,
        facets: response.data.facet_counts || null
      };
    } catch (error) {
      console.error('Solr search error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get vocabulary by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Vocabulary entry
   */
  async getVocabularyById(id) {
    try {
      const response = await this.searchVocabulary({
        query: `id:"${id}"`,
        rows: 1
      });

      if (response.success && response.data.length > 0) {
        return {
          success: true,
          data: response.data[0]
        };
      }

      return {
        success: false,
        error: 'Vocabulary not found',
        data: null
      };
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
   * Search vocabulary by English word
   * @param {string} word - English word to search
   * @param {boolean} exact - Whether to use exact match (default: false)
   * @returns {Promise<Object>} Search results
   */
  async searchByEnglishWord(word, exact = false) {
    const query = exact ? `word:"${word}"` : `word:*${word}*`;
    return await this.searchVocabulary({ query });
  }

  /**
   * Search vocabulary by Vietnamese meaning
   * @param {string} meaning - Vietnamese meaning to search
   * @param {boolean} exact - Whether to use exact match (default: false)
   * @returns {Promise<Object>} Search results
   */
  async searchByVietnameseMeaning(meaning, exact = false) {
    const query = exact ? `meaning_vi:"${meaning}"` : `meaning_vi:*${meaning}*`;
    return await this.searchVocabulary({ query });
  }

  /**
   * Get vocabulary by category/note
   * @param {string} note - Note/category to filter by
   * @returns {Promise<Object>} Search results
   */
  async getVocabularyByCategory(note) {
    return await this.searchVocabulary({
      filters: { note: note }
    });
  }

  /**
   * Get random vocabulary entries
   * @param {number} count - Number of random entries to get
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise<Object>} Random vocabulary entries
   */
  async getRandomVocabulary(count = 1, filters = {}) {
    try {
      // First get total count with filters
      const totalResponse = await this.searchVocabulary({
        query: '*:*',
        rows: 0,
        filters
      });

      if (!totalResponse.success || totalResponse.total === 0) {
        return {
          success: false,
          error: 'No vocabulary found',
          data: []
        };
      }

      const total = totalResponse.total;
      const randomStart = Math.floor(Math.random() * Math.max(1, total - count));

      return await this.searchVocabulary({
        query: '*:*',
        rows: count,
        start: randomStart,
        sort: 'random_' + Date.now() + ' desc',
        filters
      });
    } catch (error) {
      console.error('Get random vocabulary error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Add or update vocabulary entry
   * @param {Object} vocabulary - Vocabulary data
   * @param {string} vocabulary.id - Unique ID
   * @param {Array<string>} vocabulary.word - English words
   * @param {Array<string>} vocabulary.meaning_vi - Vietnamese meanings
   * @param {Array<string>} vocabulary.note - Notes/categories
   * @returns {Promise<Object>} Update result
   */
  async addVocabulary(vocabulary) {
    try {
      const doc = {
        id: vocabulary.id || this.generateId(),
        word: Array.isArray(vocabulary.word) ? vocabulary.word : [vocabulary.word],
        meaning_vi: Array.isArray(vocabulary.meaning_vi) ? vocabulary.meaning_vi : [vocabulary.meaning_vi],
        note: Array.isArray(vocabulary.note) ? vocabulary.note : [vocabulary.note || ''],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.solrUrl}/update?commit=true`,
        [doc],
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: doc,
        message: 'Vocabulary added successfully'
      };
    } catch (error) {
      console.error('Add vocabulary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete vocabulary by ID
   * @param {string} id - Document ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteVocabulary(id) {
    try {
      const response = await axios.post(
        `${this.solrUrl}/update?commit=true`,
        { delete: { id: id } },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Vocabulary deleted successfully'
      };
    } catch (error) {
      console.error('Delete vocabulary error:', error);
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
    try {
      const response = await this.searchVocabulary({
        query: '*:*',
        rows: 0,
        facets: {
          note: {
            type: 'terms',
            field: 'note',
            limit: 20
          }
        }
      });

      return {
        success: true,
        data: {
          total: response.total,
          categories: response.facets?.facet_fields?.note || []
        }
      };
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
   * Check if Solr is available
   * @returns {Promise<boolean>} True if Solr is available
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.solrUrl}/admin/ping`);
      return response.status === 200;
    } catch (error) {
      console.error('Solr availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate a unique ID for vocabulary entries
   * @returns {string} Unique ID
   */
  generateId() {
    return 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = SolrService;
