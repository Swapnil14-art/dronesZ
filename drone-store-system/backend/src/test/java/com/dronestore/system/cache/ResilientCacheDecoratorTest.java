package com.dronestore.system.cache;

import com.dronestore.system.config.ResilientCacheDecorator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.data.redis.RedisConnectionFailureException;

import java.util.concurrent.Callable;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ResilientCacheDecoratorTest {

    @Test
    @DisplayName("ResilientCacheDecorator should fall back to valueLoader when delegate get throws Redis exception")
    void testSynchronizedGet_FallbackOnRedisFailure() {
        Cache failingCache = mock(Cache.class);
        when(failingCache.getName()).thenReturn("products:detail");
        when(failingCache.get(any(), any(Callable.class)))
                .thenThrow(new RedisConnectionFailureException("Connection refused"));

        ResilientCacheDecorator resilientCache = new ResilientCacheDecorator(failingCache);

        Callable<String> dbLoader = () -> "Fresh Data From PostgreSQL";

        String result = resilientCache.get("product:123", dbLoader);
        assertEquals("Fresh Data From PostgreSQL", result);
    }

    @Test
    @DisplayName("ResilientCacheDecorator should return null on get when delegate throws Redis exception")
    void testGet_FallbackOnRedisFailure() {
        Cache failingCache = mock(Cache.class);
        when(failingCache.getName()).thenReturn("products:catalog");
        when(failingCache.get(any())).thenThrow(new RedisConnectionFailureException("Timeout"));

        ResilientCacheDecorator resilientCache = new ResilientCacheDecorator(failingCache);

        Cache.ValueWrapper wrapper = resilientCache.get("catalogKey");
        assertNull(wrapper);
    }

    @Test
    @DisplayName("ResilientCacheDecorator should swallow Redis exceptions on put, evict, clear")
    void testMutations_SwallowRedisExceptions() {
        Cache failingCache = mock(Cache.class);
        when(failingCache.getName()).thenReturn("products:catalog");
        doThrow(new RedisConnectionFailureException("Offline")).when(failingCache).put(any(), any());
        doThrow(new RedisConnectionFailureException("Offline")).when(failingCache).evict(any());
        doThrow(new RedisConnectionFailureException("Offline")).when(failingCache).clear();

        ResilientCacheDecorator resilientCache = new ResilientCacheDecorator(failingCache);

        assertDoesNotThrow(() -> resilientCache.put("key", "val"));
        assertDoesNotThrow(() -> resilientCache.evict("key"));
        assertDoesNotThrow(() -> resilientCache.clear());
    }
}
