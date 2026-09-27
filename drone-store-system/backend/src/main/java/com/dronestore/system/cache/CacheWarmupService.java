package com.dronestore.system.cache;

import com.dronestore.system.dto.CategoryDto;
import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.entity.ProductType;
import com.dronestore.system.service.CategoryService;
import com.dronestore.system.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Safe, asynchronous cache warming on application startup.
 * Pre-populates high-frequency public read data (catalog page 0, categories, top parent series)
 * so that initial visitors receive instant Redis cache hits without experiencing cold PostgreSQL latency.
 */
@Component
public class CacheWarmupService {

    private static final Logger log = LoggerFactory.getLogger(CacheWarmupService.class);

    private final ProductService productService;
    private final CategoryService categoryService;

    public CacheWarmupService(ProductService productService, CategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        CompletableFuture.runAsync(this::warmCachesSafely);
    }

    /**
     * Executes safe cache warming without blocking application startup or overloading database pool.
     */
    public void warmCachesSafely() {
        log.info("Starting safe asynchronous Redis cache warm-up...");
        long startTime = System.currentTimeMillis();

        try {
            // 1. Warm categories list
            List<CategoryDto> categories = categoryService.getAllCategories();
            log.debug("Cache warmed: {} categories preloaded.", categories != null ? categories.size() : 0);

            // 2. Warm default public catalog (page 0, size 20)
            PageResponse<ProductDto> catalog = productService.getPublicProducts(0, 20, null, null, "createdAt", "desc");
            log.debug("Cache warmed: public catalog page 0 ({} items) preloaded.",
                    catalog != null && catalog.getContent() != null ? catalog.getContent().size() : 0);

            // 3. Warm parent product variants for active PARENT products (up to 10 parents)
            if (catalog != null && catalog.getContent() != null) {
                int parentCount = 0;
                for (ProductDto p : catalog.getContent()) {
                    if (p.getProductType() == ProductType.PARENT && parentCount < 10) {
                        try {
                            List<ProductDto> children = productService.getChildProducts(p.getId());
                            log.debug("Cache warmed: Parent ID {} variants ({} items) preloaded.",
                                    p.getId(), children != null ? children.size() : 0);
                            parentCount++;
                        } catch (Exception ex) {
                            log.debug("Skipping parent ID {} during cache warm: {}", p.getId(), ex.getMessage());
                        }
                    }
                }
            }

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Redis cache warm-up completed successfully in {} ms.", elapsed);
        } catch (Exception e) {
            log.warn("Redis cache warm-up completed with partial or skipped entries: {}", e.getMessage());
        }
    }
}
