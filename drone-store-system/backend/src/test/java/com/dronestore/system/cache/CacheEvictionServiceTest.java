package com.dronestore.system.cache;

import com.dronestore.system.config.CacheNames;
import com.dronestore.system.service.CacheEvictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import static org.mockito.Mockito.*;

class CacheEvictionServiceTest {

    private CacheManager cacheManager;
    private Cache catalogCache;
    private Cache detailCache;
    private Cache childrenCache;
    private Cache categoriesListCache;
    private Cache categoryDetailCache;
    private CacheEvictionService evictionService;

    @BeforeEach
    void setUp() {
        cacheManager = mock(CacheManager.class);
        catalogCache = mock(Cache.class);
        detailCache = mock(Cache.class);
        childrenCache = mock(Cache.class);
        categoriesListCache = mock(Cache.class);
        categoryDetailCache = mock(Cache.class);

        when(cacheManager.getCache(CacheNames.PRODUCTS_CATALOG)).thenReturn(catalogCache);
        when(cacheManager.getCache(CacheNames.PRODUCT_DETAIL)).thenReturn(detailCache);
        when(cacheManager.getCache(CacheNames.PRODUCT_CHILDREN)).thenReturn(childrenCache);
        when(cacheManager.getCache(CacheNames.CATEGORIES_LIST)).thenReturn(categoriesListCache);
        when(cacheManager.getCache(CacheNames.CATEGORY_DETAIL)).thenReturn(categoryDetailCache);

        evictionService = new CacheEvictionService(cacheManager);
    }

    @Test
    @DisplayName("evictProductCatalog should clear the catalog cache")
    void testEvictProductCatalog() {
        evictionService.evictProductCatalog();
        verify(catalogCache, times(1)).clear();
    }

    @Test
    @DisplayName("evictProductDetail should evict specific product ID")
    void testEvictProductDetail() {
        evictionService.evictProductDetail(42L);
        verify(detailCache, times(1)).evict(42L);
    }

    @Test
    @DisplayName("evictProductChildren should evict specific parent ID")
    void testEvictProductChildren() {
        evictionService.evictProductChildren(99L);
        verify(childrenCache, times(1)).evict(99L);
    }

    @Test
    @DisplayName("evictProductComplete should evict catalog, detail, self children and parent children")
    void testEvictProductComplete() {
        evictionService.evictProductComplete(10L, 5L);

        verify(catalogCache, times(1)).clear();
        verify(detailCache, times(1)).evict(10L);
        verify(childrenCache, times(1)).evict(10L);
        verify(childrenCache, times(1)).evict(5L);
    }

    @Test
    @DisplayName("evictCategoryComplete should evict category list, category detail and product catalog")
    void testEvictCategoryComplete() {
        evictionService.evictCategoryComplete(3L);

        verify(categoriesListCache, times(1)).clear();
        verify(categoryDetailCache, times(1)).evict(3L);
        verify(catalogCache, times(1)).clear();
    }
}
