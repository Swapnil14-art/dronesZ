package com.dronestore.system.cache;

import com.dronestore.system.config.RedisFallbackCacheErrorHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.RedisSystemException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RedisFallbackCacheErrorHandlerTest {

    private final RedisFallbackCacheErrorHandler errorHandler = new RedisFallbackCacheErrorHandler();

    @Test
    @DisplayName("handleCacheGetError should swallow Redis exception and not throw to allow DB fallback")
    void handleCacheGetError_ShouldNotThrowException() {
        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("products:catalog");

        RuntimeException redisException = new RedisConnectionFailureException("Connection refused: localhost:6379");

        assertDoesNotThrow(() -> errorHandler.handleCacheGetError(redisException, mockCache, "catalogKey"));
    }

    @Test
    @DisplayName("handleCachePutError should swallow Redis exception and not throw")
    void handleCachePutError_ShouldNotThrowException() {
        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("products:detail");

        RuntimeException redisException = new RedisSystemException("Command timed out after 2000ms", new RuntimeException());

        assertDoesNotThrow(() -> errorHandler.handleCachePutError(redisException, mockCache, 1L, "sampleValue"));
    }

    @Test
    @DisplayName("handleCacheEvictError should swallow Redis exception and not throw")
    void handleCacheEvictError_ShouldNotThrowException() {
        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("products:detail");

        RuntimeException redisException = new RedisConnectionFailureException("Redis host unreachable");

        assertDoesNotThrow(() -> errorHandler.handleCacheEvictError(redisException, mockCache, 1L));
    }

    @Test
    @DisplayName("handleCacheClearError should swallow Redis exception and not throw")
    void handleCacheClearError_ShouldNotThrowException() {
        Cache mockCache = mock(Cache.class);
        when(mockCache.getName()).thenReturn("products:catalog");

        RuntimeException redisException = new RedisConnectionFailureException("Redis connection pool exhausted");

        assertDoesNotThrow(() -> errorHandler.handleCacheClearError(redisException, mockCache));
    }
}
