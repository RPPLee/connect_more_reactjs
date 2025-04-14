/**
 * CacheService - A service for caching API responses in localStorage with TTL
 */

interface CachedItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
}

class CacheService {
  /**
   * Gets an item from cache
   * @param key - The cache key
   * @returns The cached data if valid, null otherwise
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const cachedItem: CachedItem<T> = JSON.parse(item);
      const now = Date.now();

      // Check if the item has expired
      if (now - cachedItem.timestamp > cachedItem.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return cachedItem.data;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }

  /**
   * Sets an item in cache with TTL
   * @param key - The cache key
   * @param data - The data to cache
   * @param ttl - Time-to-live in milliseconds (default: 24 hours)
   */
  set<T>(key: string, data: T, ttl = 24 * 60 * 60 * 1000): void {
    try {
      const item: CachedItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Removes an item from cache
   * @param key - The cache key
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Removes all items matching a prefix
   * @param prefix - The key prefix to match
   */
  removeByPrefix(prefix: string): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  /**
   * Clears all cached data
   */
  clear(): void {
    localStorage.clear();
  }
}

// Export a singleton instance
export const cacheService = new CacheService(); 