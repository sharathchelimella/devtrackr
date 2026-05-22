/**
 * utils/cache.js – In-Memory Caching Layer
 * Uses node-cache to reduce redundant GitHub API calls.
 */

const NodeCache = require('node-cache');

// TTL = 15 minutes, check period = 30 seconds
const cache = new NodeCache({ stdTTL: 900, checkperiod: 30 });

/**
 * Get a cached value or compute it if missing.
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @param {number} [ttl] - Optional custom TTL in seconds
 * @returns {Promise<any>} Cached or freshly fetched value
 */
const getOrSet = async (key, fetchFn, ttl) => {
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`🗃️  Cache HIT for key: ${key}`);
    return cached;
  }

  console.log(`🔄 Cache MISS for key: ${key} — fetching...`);
  const data = await fetchFn();
  cache.set(key, data, ttl || 900);
  return data;
};

/**
 * Invalidate a specific cache key (e.g., after a new GitHub connect).
 * @param {string} key
 */
const invalidate = (key) => {
  cache.del(key);
  console.log(`🗑️  Cache invalidated for key: ${key}`);
};

/**
 * Flush all keys matching a prefix (e.g., all data for a user).
 * @param {string} prefix
 */
const invalidateByPrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  cache.del(keys);
  console.log(`🗑️  Cache invalidated ${keys.length} keys with prefix: ${prefix}`);
};

module.exports = { getOrSet, invalidate, invalidateByPrefix, cache };
