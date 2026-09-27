package com.dronestore.system.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class RedisConfigTest {

    private final RedisConfig redisConfig = new RedisConfig();

    @Test
    @DisplayName("redisConnectionFactory should correctly parse Render Redis URL")
    void testRenderRedisUrlConfiguration() {
        RedisProperties properties = new RedisProperties();
        properties.setUrl("redis://red-daqhg9m7bikc738hn29g:6379");
        properties.setTimeout(Duration.ofMillis(2500));

        LettuceConnectionFactory factory = redisConfig.redisConnectionFactory(properties);
        assertNotNull(factory);

        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();
        assertNotNull(standaloneConfig);
        assertEquals("red-daqhg9m7bikc738hn29g", standaloneConfig.getHostName());
        assertEquals(6379, standaloneConfig.getPort());
        assertEquals(0, standaloneConfig.getDatabase());
        assertFalse(standaloneConfig.getPassword().toOptional().isPresent());
    }

    @Test
    @DisplayName("redisConnectionFactory should correctly parse Localhost Redis URL")
    void testLocalhostRedisUrlConfiguration() {
        RedisProperties properties = new RedisProperties();
        properties.setUrl("redis://localhost:6379");

        LettuceConnectionFactory factory = redisConfig.redisConnectionFactory(properties);
        assertNotNull(factory);

        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();
        assertNotNull(standaloneConfig);
        assertEquals("localhost", standaloneConfig.getHostName());
        assertEquals(6379, standaloneConfig.getPort());
    }

    @Test
    @DisplayName("redisConnectionFactory should correctly parse authenticated SSL Redis URL")
    void testAuthenticatedSslRedisUrlConfiguration() {
        RedisProperties properties = new RedisProperties();
        properties.setUrl("rediss://admin:secretPass123@redis-cluster.internal:6380/3");

        LettuceConnectionFactory factory = redisConfig.redisConnectionFactory(properties);
        assertNotNull(factory);

        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();
        assertNotNull(standaloneConfig);
        assertEquals("redis-cluster.internal", standaloneConfig.getHostName());
        assertEquals(6380, standaloneConfig.getPort());
        assertEquals(3, standaloneConfig.getDatabase());
        assertEquals("admin", standaloneConfig.getUsername());
        assertEquals("secretPass123", standaloneConfig.getPassword().toOptional().map(String::new).orElse(""));
        assertTrue(factory.getClientConfiguration().isUseSsl());
    }

    @Test
    @DisplayName("redisConnectionFactory should fallback to host/port properties when URL is empty")
    void testFallbackToHostPortProperties() {
        RedisProperties properties = new RedisProperties();
        properties.setUrl("");
        properties.setHost("custom-redis-host");
        properties.setPort(6389);
        properties.setPassword("customPass");
        properties.setDatabase(2);

        LettuceConnectionFactory factory = redisConfig.redisConnectionFactory(properties);
        assertNotNull(factory);

        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();
        assertNotNull(standaloneConfig);
        assertEquals("custom-redis-host", standaloneConfig.getHostName());
        assertEquals(6389, standaloneConfig.getPort());
        assertEquals(2, standaloneConfig.getDatabase());
        assertEquals("customPass", standaloneConfig.getPassword().toOptional().map(String::new).orElse(""));
    }

    @Test
    @DisplayName("cacheManager should wrap caches in ResilientCacheDecorator")
    void testCacheManagerResilience() {
        RedisProperties properties = new RedisProperties();
        properties.setUrl("redis://localhost:6379");
        LettuceConnectionFactory factory = redisConfig.redisConnectionFactory(properties);

        CacheManager cacheManager = redisConfig.cacheManager(factory);
        assertNotNull(cacheManager);

        Cache cache = cacheManager.getCache(CacheNames.PRODUCTS_CATALOG);
        assertNotNull(cache);
        assertTrue(cache instanceof ResilientCacheDecorator);
    }
}
