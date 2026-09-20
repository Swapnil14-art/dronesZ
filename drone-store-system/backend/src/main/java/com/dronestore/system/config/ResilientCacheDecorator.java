package com.dronestore.system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;

import java.util.concurrent.Callable;

/**
 * Decorates a Spring Cache (e.g. RedisCache) to ensure complete resilience:
 * If Redis is offline, disconnected, or times out, all operations (including
 * sync=true get(key, valueLoader) and get/put/evict/clear) catch runtime exceptions,
 * log a warning, and immediately fall back to the PostgreSQL database source of truth.
 */
public class ResilientCacheDecorator implements Cache {

    private static final Logger log = LoggerFactory.getLogger(ResilientCacheDecorator.class);

    private final Cache delegate;

    public ResilientCacheDecorator(Cache delegate) {
        this.delegate = delegate;
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    public ValueWrapper get(Object key) {
        try {
            return delegate.get(key);
        } catch (RuntimeException e) {
            log.warn("Redis GET failed for cache '{}', key '{}'. Falling back to DB. Cause: {}",
                    getName(), key, e.getMessage());
            return null;
        }
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        try {
            return delegate.get(key, type);
        } catch (RuntimeException e) {
            log.warn("Redis typed GET failed for cache '{}', key '{}'. Falling back to DB. Cause: {}",
                    getName(), key, e.getMessage());
            return null;
        }
    }

    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        try {
            return delegate.get(key, valueLoader);
        } catch (RuntimeException e) {
            log.warn("Redis synchronized GET failed for cache '{}', key '{}'. Falling back to DB. Cause: {}",
                    getName(), key, e.getMessage());
            try {
                return valueLoader.call();
            } catch (Exception ex) {
                if (ex instanceof RuntimeException) {
                    throw (RuntimeException) ex;
                }
                throw new ValueRetrievalException(key, valueLoader, ex);
            }
        }
    }

    @Override
    public void put(Object key, Object value) {
        try {
            delegate.put(key, value);
        } catch (RuntimeException e) {
            log.warn("Redis PUT failed for cache '{}', key '{}'. Continuing without cache write. Cause: {}",
                    getName(), key, e.getMessage());
        }
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        try {
            return delegate.putIfAbsent(key, value);
        } catch (RuntimeException e) {
            log.warn("Redis PUT_IF_ABSENT failed for cache '{}', key '{}'. Continuing without cache write. Cause: {}",
                    getName(), key, e.getMessage());
            return null;
        }
    }

    @Override
    public void evict(Object key) {
        try {
            delegate.evict(key);
        } catch (RuntimeException e) {
            log.warn("Redis EVICT failed for cache '{}', key '{}'. Continuing execution. Cause: {}",
                    getName(), key, e.getMessage());
        }
    }

    @Override
    public boolean evictIfPresent(Object key) {
        try {
            return delegate.evictIfPresent(key);
        } catch (RuntimeException e) {
            log.warn("Redis EVICT_IF_PRESENT failed for cache '{}', key '{}'. Continuing execution. Cause: {}",
                    getName(), key, e.getMessage());
            return false;
        }
    }

    @Override
    public void clear() {
        try {
            delegate.clear();
        } catch (RuntimeException e) {
            log.warn("Redis CLEAR failed for cache '{}'. Continuing execution. Cause: {}",
                    getName(), e.getMessage());
        }
    }

    @Override
    public boolean invalidate() {
        try {
            return delegate.invalidate();
        } catch (RuntimeException e) {
            log.warn("Redis INVALIDATE failed for cache '{}'. Continuing execution. Cause: {}",
                    getName(), e.getMessage());
            return false;
        }
    }
}
