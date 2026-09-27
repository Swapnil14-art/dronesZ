package com.dronestore.system.cache;

import com.dronestore.system.dto.CategoryDto;
import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.entity.ProductType;
import com.dronestore.system.service.CategoryService;
import com.dronestore.system.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

class CacheMetricsAndWarmupTest {

    @Test
    @DisplayName("CacheMetricsCollector should accurately record hits, misses, and calculate hit rates")
    void testCacheMetricsCollector_HitAndMissTracking() {
        CacheMetricsCollector collector = new CacheMetricsCollector();

        collector.recordHit("products:catalog", 1_000_000L); // 1ms
        collector.recordHit("products:catalog", 2_000_000L); // 2ms
        collector.recordMiss("products:catalog", 3_000_000L); // 3ms

        assertEquals(2, collector.getHits("products:catalog"));
        assertEquals(1, collector.getMisses("products:catalog"));
        assertEquals(3, collector.getTotalHits() + collector.getTotalMisses());
        assertEquals(66.67, collector.getHitRate("products:catalog"), 0.1);
        assertEquals(2.0, collector.getAverageGetLatencyMs("products:catalog"), 0.1);

        collector.recordPut("products:catalog");
        collector.recordEviction("products:catalog");

        assertEquals(1, collector.getTotalPuts());
        assertEquals(1, collector.getTotalEvictions());

        collector.reset();
        assertEquals(0, collector.getTotalHits());
        assertEquals(0, collector.getTotalMisses());
    }

    @Test
    @DisplayName("CacheWarmupService should safely warm categories, catalog, and parent variants")
    void testCacheWarmupService_Execution() {
        ProductService productService = mock(ProductService.class);
        CategoryService categoryService = mock(CategoryService.class);

        CategoryDto catDto = new CategoryDto(1L, "Motors", "FPV Motors", false, null, null, null);
        when(categoryService.getAllCategories()).thenReturn(Collections.singletonList(catDto));

        ProductDto parentProduct = new ProductDto();
        parentProduct.setId(10L);
        parentProduct.setName("Series 7 Frame");
        parentProduct.setProductType(ProductType.PARENT);

        PageResponse<ProductDto> pageResponse = new PageResponse<>(
                Collections.singletonList(parentProduct), 0, 20, 1L, 1
        );
        when(productService.getPublicProducts(0, 20, null, null, "createdAt", "desc")).thenReturn(pageResponse);

        ProductDto childDto = new ProductDto();
        childDto.setId(11L);
        childDto.setName("Series 7 - 5 inch");
        childDto.setProductType(ProductType.CHILD);
        when(productService.getChildProducts(10L)).thenReturn(Collections.singletonList(childDto));

        CacheWarmupService warmupService = new CacheWarmupService(productService, categoryService);
        assertDoesNotThrow(warmupService::warmCachesSafely);

        verify(categoryService, times(1)).getAllCategories();
        verify(productService, times(1)).getPublicProducts(0, 20, null, null, "createdAt", "desc");
        verify(productService, times(1)).getChildProducts(10L);
    }
}
