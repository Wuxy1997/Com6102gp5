import { LRUCache } from "lru-cache"

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: false,
  updateAgeOnGet: true,
  updateAgeOnHas: true
})

export { cache }

// Helper functions for cache operations
export async function getFromCache<T>(key: string): Promise<T | undefined> {
  return cache.get(key) as T | undefined
}

export async function setInCache<T>(key: string, value: T, ttl?: number): Promise<void> {
  cache.set(key, value, { ttl })
}

export async function deleteFromCache(key: string): Promise<void> {
  cache.delete(key)
}

export async function clearCache(): Promise<void> {
  cache.clear()
}

// Cache middleware for API routes
export function withCache(handler: Function) {
  return async function (...args: any[]) {
    const [req] = args
    const cacheKey = `${req.method}:${req.url}`
    
    // Try to get from cache first
    const cached = await getFromCache(cacheKey)
    if (cached) {
      return cached
    }
    
    // If not in cache, execute handler
    const result = await handler(...args)
    
    // Store in cache
    await setInCache(cacheKey, result)
    
    return result
  }
} 