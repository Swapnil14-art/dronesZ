package com.dronestore.system.config;

import com.dronestore.system.cache.CacheMetricsCollector;
import org.springframework.cache.Cache;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;

import java.util.Map;

/**
 * Custom RedisCacheManager that decorates every RedisCache instance with ResilientCacheDecorator.
 * Guarantees that any Redis connection outage or timeout falls back immediately to the database,
 * while capturing efficiency metrics in CacheMetricsCollector.
 */
public class ResilientRedisCacheManager extends RedisCacheManager {

    private final CacheMetricsCollector metricsCollector;

    public ResilientRedisCacheManager(RedisCacheWriter cacheWriter,
                                      RedisCacheConfiguration defaultCacheConfiguration,
                                      Map<String, RedisCacheConfiguration> initialCacheConfigurations) {
        this(cacheWriter, defaultCacheConfiguration, initialCacheConfigurations, null);
    }

    public ResilientRedisCacheManager(RedisCacheWriter cacheWriter,
                                      RedisCacheConfiguration defaultCacheConfiguration,
                                      Map<String, RedisCacheConfiguration> initialCacheConfigurations,
                                      CacheMetricsCollector metricsCollector) {
        super(cacheWriter, defaultCacheConfiguration, initialCacheConfigurations);
        this.metricsCollector = metricsCollector;
    }

    @Override
    protected Cache decorateCache(Cache cache) {
        return new ResilientCacheDecorator(super.decorateCache(cache), metricsCollector);
    }
}
