// Caching Services
// Redis-based caching, cache management, and future similarity caching

import basicCache from './basic-cache.js';
import cacheKeyStrategy from './cache-key-strategy.js';
import cacheManager from './cache-manager-simple.js';

// Full cache manager with PostgreSQL (has dependency issues)
// import fullCacheManager from './cache-manager.js';

// Future similarity caching (will be implemented later)
// import similarityCache from './similarity-cache.js';

export {
  basicCache,
  cacheKeyStrategy,
  cacheManager, // Currently using simple Redis-only version
  // similarityCache // Will be uncommented when implemented
}; 