package com.dronestore.system.config;

import com.dronestore.system.cache.CacheMetricsCollector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;

import java.util.concurrent.Callable;

/**
 * Decorates a Spring Cache (e.g. RedisCache) to ensure complete resilience and observability:
 * 1. Resilience: If Redis is offline, disconnected, or times out, all operations (including
 *    sync=true get(key, valueLoader) and get/put/evict/clear) catch runtime exceptions,
 *    log a warning, and immediately fall back to the PostgreSQL database source of truth.
 * 2. Observability: Records execution metrics (hits, misses, Redis GET latency, puts, evictions)
 *    into CacheMetricsCollector without exposing public internal endpoints.
 */
public class ResilientCacheDecorator implements Cache {

    private static final Logger log = LoggerFactory.getLogger(ResilientCacheDecorator.class);

    private final Cache delegate;
    private final CacheMetricsCollector metricsCollector;

    public ResilientCacheDecorator(Cache delegate) {
        this(delegate, null);
    }

    public ResilientCacheDecorator(Cache delegate, CacheMetricsCollector metricsCollector) {
        this.delegate = delegate;
        this.metricsCollector = metricsCollector;
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
        long start = System.nanoTime();
        try {
            ValueWrapper wrapper = delegate.get(key);
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                if (wrapper != null) {
                    metricsCollector.recordHit(getName(), duration);
                } else {
                    metricsCollector.recordMiss(getName(), duration);
                }
            }
            return wrapper;
        } catch (RuntimeException e) {
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                metricsCollector.recordMiss(getName(), duration);
            }
            log.warn("Redis GET failed for cache '{}', key '{}'. Falling back to DB. Cause: {}",
                    getName(), key, e.getMessage());
            return null;
        }
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        long start = System.nanoTime();
        try {
            T value = delegate.get(key, type);
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                if (value != null) {
                    metricsCollector.recordHit(getName(), duration);
                } else {
                    metricsCollector.recordMiss(getName(), duration);
                }
            }
            return value;
        } catch (RuntimeException e) {
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                metricsCollector.recordMiss(getName(), duration);
            }
            log.warn("Redis typed GET failed for cache '{}', key '{}'. Falling back to DB. Cause: {}",
                    getName(), key, e.getMessage());
            return null;
        }
    }

    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        long start = System.nanoTime();
        try {
            T value = delegate.get(key, valueLoader);
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                metricsCollector.recordHit(getName(), duration);
            }
            return value;
        } catch (RuntimeException e) {
            long duration = System.nanoTime() - start;
            if (metricsCollector != null) {
                metricsCollector.recordMiss(getName(), duration);
            }
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
            if (metricsCollector != null) {
                metricsCollector.recordPut(getName());
            }
        } catch (RuntimeException e) {
            log.warn("Redis PUT failed for cache '{}', key '{}'. Continuing without cache write. Cause: {}",
                    getName(), key, e.getMessage());
        }
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        try {
            ValueWrapper wrapper = delegate.putIfAbsent(key, value);
            if (metricsCollector != null) {
                metricsCollector.recordPut(getName());
            }
            return wrapper;
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
            if (metricsCollector != null) {
                metricsCollector.recordEviction(getName());
            }
        } catch (RuntimeException e) {
            log.warn("Redis EVICT failed for cache '{}', key '{}'. Continuing execution. Cause: {}",
                    getName(), key, e.getMessage());
        }
    }

    @Override
    public boolean evictIfPresent(Object key) {
        try {
            boolean evicted = delegate.evictIfPresent(key);
            if (metricsCollector != null && evicted) {
                metricsCollector.recordEviction(getName());
            }
            return evicted;
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
            if (metricsCollector != null) {
                metricsCollector.recordEviction(getName());
            }
        } catch (RuntimeException e) {
            log.warn("Redis CLEAR failed for cache '{}'. Continuing execution. Cause: {}",
                    getName(), e.getMessage());
        }
    }

    @Override
    public boolean invalidate() {
        try {
            boolean invalidated = delegate.invalidate();
            if (metricsCollector != null && invalidated) {
                metricsCollector.recordEviction(getName());
            }
            return invalidated;
        } catch (RuntimeException e) {
            log.warn("Redis INVALIDATE failed for cache '{}'. Continuing execution. Cause: {}",
                    getName(), e.getMessage());
            return false;
        }
    }
}
