/**
 * A Least Recently Used (LRU) cache with Time-to-Live (TTL) support. Items are kept in the cache until they either
 * reach their TTL or the cache reaches its size and/or item limit. When the limit is exceeded, the cache evicts the
 * item that was least recently accessed (based on the timestamp of access). Items are also automatically evicted if they
 * are expired, as determined by the TTL.
 * An item is considered accessed, and its last accessed timestamp is updated, whenever `has`, `get`, or `set` is called with its key.
 *
 * Implement the LRU cache provider here and use the lru-cache.test.ts to check your implementation.
 * You're encouraged to add additional functions that make working with the cache easier for consumers.
 */

type LRUCacheProviderOptions = {
  ttl: number // Time to live in milliseconds
  itemLimit: number
}
type LRUCacheProvider<T> = {
  has: (key: string) => boolean
  get: (key: string) => T | undefined
  set: (key: string, value: T) => void
}

// TODO: Implement LRU cache provider
export function createLRUCacheProvider<T>({
  ttl,
  itemLimit,
}: LRUCacheProviderOptions): LRUCacheProvider<T> {
  const cacheData = new Map();
  const cacheDate = new Map();
  const keysQueue: Array<string> = [];

  const hasKey = (key: string) => cacheData.has(key) && cacheDate.has(key);
  const updateDateByKey = (key: string) => {
    cacheDate.set(key, Date.now());
    keysQueue.splice(keysQueue.indexOf(key), 1)
    keysQueue.push(key)
  }

  return {
    has: (key: string) => {
      if (hasKey(key)) {
        if (Date.now() - cacheDate.get(key) < ttl) {
          updateDateByKey(key);
          return true;
        } else {
          cacheData.delete(key);
          cacheDate.delete(key);
        }
      }
      return false;
    },
    get: (key: string) => {
      if (hasKey(key)) {
        if (Date.now() - cacheDate.get(key) < ttl) {
          updateDateByKey(key);
          return cacheData.get(key);
        } else {
          cacheData.delete(key);
          cacheDate.delete(key);
        }
      }
      return undefined;
    },
    set: (key: string, value: T) => {
      if (keysQueue.length >= itemLimit) {
        const firstKey = keysQueue.shift();
        cacheData.delete(firstKey);
        cacheDate.delete(firstKey);
      }
      cacheData.set(key, value)
      cacheDate.set(key, Date.now())
      keysQueue.push(key);
    },
  }
}
