package com.dronestore.system.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import io.lettuce.core.RedisURI;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig extends CachingConfigurerSupport {

    @Value("${dronestore.cache.ttl.products-catalog:600}")
    private long productsCatalogTtl;

    @Value("${dronestore.cache.ttl.product-detail:900}")
    private long productDetailTtl;

    @Value("${dronestore.cache.ttl.product-children:900}")
    private long productChildrenTtl;

    @Value("${dronestore.cache.ttl.product-images:900}")
    private long productImagesTtl;

    @Value("${dronestore.cache.ttl.product-sections:900}")
    private long productSectionsTtl;

    @Value("${dronestore.cache.ttl.categories:900}")
    private long categoriesTtl;

    @Value("${dronestore.cache.ttl.default:600}")
    private long defaultTtl;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory(RedisProperties redisProperties) {
        GenericObjectPoolConfig<?> poolConfig = new GenericObjectPoolConfig<>();
        if (redisProperties.getLettuce() != null && redisProperties.getLettuce().getPool() != null) {
            RedisProperties.Pool pool = redisProperties.getLettuce().getPool();
            poolConfig.setMaxTotal(pool.getMaxActive());
            poolConfig.setMaxIdle(pool.getMaxIdle());
            poolConfig.setMinIdle(pool.getMinIdle());
            if (pool.getMaxWait() != null) {
                poolConfig.setMaxWait(pool.getMaxWait());
            }
        }

        Duration timeout = redisProperties.getTimeout() != null ? redisProperties.getTimeout() : Duration.ofMillis(2000);

        SocketOptions socketOptions = SocketOptions.builder()
                .connectTimeout(timeout)
                .keepAlive(true)
                .build();

        ClientOptions clientOptions = ClientOptions.builder()
                .socketOptions(socketOptions)
                .autoReconnect(true)
                .build();

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettucePoolingClientConfiguration.builder()
                .poolConfig(poolConfig)
                .commandTimeout(timeout)
                .clientOptions(clientOptions);

        if (redisProperties.isSsl()) {
            builder.useSsl();
        }

        LettuceClientConfiguration clientConfiguration = builder.build();

        String url = redisProperties.getUrl();
        if (url != null && !url.trim().isEmpty()) {
            RedisURI redisUri = RedisURI.create(url);
            RedisStandaloneConfiguration standaloneConfig = new RedisStandaloneConfiguration();
            standaloneConfig.setHostName(redisUri.getHost());
            standaloneConfig.setPort(redisUri.getPort());
            if (redisUri.getPassword() != null && redisUri.getPassword().length > 0) {
                standaloneConfig.setPassword(RedisPassword.of(new String(redisUri.getPassword())));
            }
            if (redisUri.getDatabase() >= 0) {
                standaloneConfig.setDatabase(redisUri.getDatabase());
            }
            return new LettuceConnectionFactory(standaloneConfig, clientConfiguration);
        }

        RedisStandaloneConfiguration standaloneConfig = new RedisStandaloneConfiguration();
        standaloneConfig.setHostName(redisProperties.getHost() != null ? redisProperties.getHost() : "localhost");
        standaloneConfig.setPort(redisProperties.getPort() > 0 ? redisProperties.getPort() : 6379);
        if (redisProperties.getPassword() != null && !redisProperties.getPassword().isEmpty()) {
            standaloneConfig.setPassword(RedisPassword.of(redisProperties.getPassword()));
        }
        standaloneConfig.setDatabase(redisProperties.getDatabase());

        return new LettuceConnectionFactory(standaloneConfig, clientConfiguration);
    }

    private GenericJackson2JsonRedisSerializer createJsonRedisSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonRedisSerializer();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(defaultTtl))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(stringSerializer))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put(CacheNames.PRODUCTS_CATALOG,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(productsCatalogTtl)));

        cacheConfigurations.put(CacheNames.PRODUCT_DETAIL,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(productDetailTtl)));

        cacheConfigurations.put(CacheNames.PRODUCT_CHILDREN,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(productChildrenTtl)));

        cacheConfigurations.put(CacheNames.PRODUCT_IMAGES,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(productImagesTtl)));

        cacheConfigurations.put(CacheNames.PRODUCT_SECTIONS,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(productSectionsTtl)));

        cacheConfigurations.put(CacheNames.CATEGORIES_LIST,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(categoriesTtl)));

        cacheConfigurations.put(CacheNames.CATEGORY_DETAIL,
                defaultCacheConfig.entryTtl(Duration.ofSeconds(categoriesTtl)));

        org.springframework.data.redis.cache.RedisCacheWriter cacheWriter =
                org.springframework.data.redis.cache.RedisCacheWriter.nonLockingRedisCacheWriter(redisConnectionFactory);

        return new ResilientRedisCacheManager(cacheWriter, defaultCacheConfig, cacheConfigurations);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());

        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new RedisFallbackCacheErrorHandler();
    }
}
