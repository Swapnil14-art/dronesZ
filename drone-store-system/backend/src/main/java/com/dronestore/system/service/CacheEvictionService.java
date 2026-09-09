package com.dronestore.system.service;

import com.dronestore.system.config.CacheNames;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

/**
 * Helper service to coordinate granular and bulk cache invalidation
 * whenever Admin creates, updates, or deletes products, categories, images, or content sections.
 */
@Service
public class CacheEvictionService {

    private static final Logger log = LoggerFactory.getLogger(CacheEvictionService.class);

    private final CacheManager cacheManager;

    public CacheEvictionService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Clears all cached pages/queries of the public product catalog.
     */
    public void evictProductCatalog() {
        try {
            Cache catalogCache = cacheManager.getCache(CacheNames.PRODUCTS_CATALOG);
            if (catalogCache != null) {
                catalogCache.clear();
                log.debug("Evicted all entries in cache '{}'", CacheNames.PRODUCTS_CATALOG);
            }
        } catch (Exception e) {
            log.warn("Failed to clear '{}' cache: {}", CacheNames.PRODUCTS_CATALOG, e.getMessage());
        }
    }

    /**
     * Evicts cached product detail for a specific product ID.
     */
    public void evictProductDetail(Long productId) {
        if (productId == null) return;
        try {
            Cache detailCache = cacheManager.getCache(CacheNames.PRODUCT_DETAIL);
            if (detailCache != null) {
                detailCache.evict(productId);
                log.debug("Evicted product ID {} from cache '{}'", productId, CacheNames.PRODUCT_DETAIL);
            }
        } catch (Exception e) {
            log.warn("Failed to evict product ID {} from '{}': {}", productId, CacheNames.PRODUCT_DETAIL, e.getMessage());
        }
    }

    /**
     * Evicts cached child products for a specific parent product ID.
     */
    public void evictProductChildren(Long parentId) {
        if (parentId == null) return;
        try {
            Cache childrenCache = cacheManager.getCache(CacheNames.PRODUCT_CHILDREN);
            if (childrenCache != null) {
                childrenCache.evict(parentId);
                log.debug("Evicted parent ID {} from cache '{}'", parentId, CacheNames.PRODUCT_CHILDREN);
            }
        } catch (Exception e) {
            log.warn("Failed to evict parent ID {} from '{}': {}", parentId, CacheNames.PRODUCT_CHILDREN, e.getMessage());
        }
    }

    /**
     * Evicts cached image metadata for a specific product ID.
     */
    public void evictProductImages(Long productId) {
        if (productId == null) return;
        try {
            Cache imagesCache = cacheManager.getCache(CacheNames.PRODUCT_IMAGES);
            if (imagesCache != null) {
                imagesCache.evict(productId);
                log.debug("Evicted product ID {} from cache '{}'", productId, CacheNames.PRODUCT_IMAGES);
            }
        } catch (Exception e) {
            log.warn("Failed to evict product ID {} from '{}': {}", productId, CacheNames.PRODUCT_IMAGES, e.getMessage());
        }
    }

    /**
     * Evicts cached content sections for a specific product ID.
     */
    public void evictProductSections(Long productId) {
        if (productId == null) return;
        try {
            Cache sectionsCache = cacheManager.getCache(CacheNames.PRODUCT_SECTIONS);
            if (sectionsCache != null) {
                sectionsCache.evict(productId + ":true");
                sectionsCache.evict(productId + ":false");
                log.debug("Evicted product ID {} from cache '{}'", productId, CacheNames.PRODUCT_SECTIONS);
            }
        } catch (Exception e) {
            log.warn("Failed to evict product ID {} from '{}': {}", productId, CacheNames.PRODUCT_SECTIONS, e.getMessage());
        }
    }

    /**
     * Comprehensive eviction when a product is created, updated, or deleted.
     */
    public void evictProductComplete(Long productId, Long parentId) {
        evictProductCatalog();
        if (productId != null) {
            evictProductDetail(productId);
            evictProductChildren(productId); // In case this was a parent product
            evictProductImages(productId);
            evictProductSections(productId);
        }
        if (parentId != null) {
            evictProductDetail(parentId);
            evictProductChildren(parentId); // In case this was a child product
            evictProductImages(parentId);
            evictProductSections(parentId);
        }
    }

    /**
     * Invalidation when product images or content sections change.
     */
    public void evictProductContentOrImageChange(Long productId, Long parentId) {
        evictProductCatalog();
        if (productId != null) {
            evictProductDetail(productId);
            evictProductChildren(productId);
            evictProductImages(productId);
            evictProductSections(productId);
        }
        if (parentId != null) {
            evictProductDetail(parentId);
            evictProductChildren(parentId);
            evictProductImages(parentId);
            evictProductSections(parentId);
        }
    }

    /**
     * Invalidation when categories are created, updated, or deleted.
     */
    public void evictCategoryComplete(Long categoryId) {
        try {
            Cache listCache = cacheManager.getCache(CacheNames.CATEGORIES_LIST);
            if (listCache != null) {
                listCache.clear();
                log.debug("Evicted all entries in cache '{}'", CacheNames.CATEGORIES_LIST);
            }
            if (categoryId != null) {
                Cache detailCache = cacheManager.getCache(CacheNames.CATEGORY_DETAIL);
                if (detailCache != null) {
                    detailCache.evict(categoryId);
                    log.debug("Evicted category ID {} from cache '{}'", categoryId, CacheNames.CATEGORY_DETAIL);
                }
            }
            // Invalidate product catalog since category names and filtering change
            evictProductCatalog();
        } catch (Exception e) {
            log.warn("Failed to evict category cache: {}", e.getMessage());
        }
    }
}
