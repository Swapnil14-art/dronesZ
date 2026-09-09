package com.dronestore.system.config;

import org.springframework.cache.Cache;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;

import java.util.Map;

/**
 * Custom RedisCacheManager that decorates every RedisCache instance with ResilientCacheDecorator.
 * Guarantees that any Redis connection outage or timeout falls back immediately to the database.
 */
public class ResilientRedisCacheManager extends RedisCacheManager {

    public ResilientRedisCacheManager(RedisCacheWriter cacheWriter,
                                      RedisCacheConfiguration defaultCacheConfiguration,
                                      Map<String, RedisCacheConfiguration> initialCacheConfigurations) {
        super(cacheWriter, defaultCacheConfiguration, initialCacheConfigurations);
    }

    @Override
    protected Cache decorateCache(Cache cache) {
        return new ResilientCacheDecorator(super.decorateCache(cache));
    }
}
