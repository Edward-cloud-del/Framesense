// Caching Services
// Redis-based caching, cache management, and future similarity caching

const BasicCache = require('./basic-cache');
const CacheManager = require('./cache-manager');

// Future similarity caching (will be implemented later)
// const SimilarityCache = require('./similarity-cache');

module.exports = {
  BasicCache,
  CacheManager,
  // SimilarityCache // Will be uncommented when implemented
}; 