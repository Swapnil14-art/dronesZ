package com.dronestore.system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * CacheErrorHandler implementation that ensures full resilience:
 * If Redis is unavailable or times out, errors are logged as warnings and
 * cache misses / writes / evictions fail silently so the application seamlessly
 * falls back to the database (PostgreSQL/Supabase) without breaking API responses.
 */
public class RedisFallbackCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(RedisFallbackCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Redis GET failed for cache '{}' and key '{}'. Falling back to database source of truth. Cause: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("Redis PUT failed for cache '{}' and key '{}'. Continuing without caching. Cause: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Redis EVICT failed for cache '{}' and key '{}'. Continuing execution. Cause: {}",
                cache != null ? cache.getName() : "unknown", key, exception.getMessage());
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.warn("Redis CLEAR failed for cache '{}'. Continuing execution. Cause: {}",
                cache != null ? cache.getName() : "unknown", exception.getMessage());
    }
}
