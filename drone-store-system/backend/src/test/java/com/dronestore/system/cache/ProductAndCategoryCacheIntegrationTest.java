package com.dronestore.system.cache;

import com.dronestore.system.config.CacheNames;
import com.dronestore.system.dto.*;
import com.dronestore.system.entity.Category;
import com.dronestore.system.entity.Product;
import com.dronestore.system.entity.ProductContentSection;
import com.dronestore.system.entity.ProductImage;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;
import com.dronestore.system.repository.CategoryRepository;
import com.dronestore.system.repository.ProductContentSectionRepository;
import com.dronestore.system.repository.ProductImageRepository;
import com.dronestore.system.repository.ProductRepository;
import com.dronestore.system.service.CacheEvictionService;
import com.dronestore.system.service.CategoryService;
import com.dronestore.system.service.ProductImageService;
import com.dronestore.system.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(SpringExtension.class)
@Import({
        ProductAndCategoryCacheIntegrationTest.TestCacheConfig.class,
        ProductService.class,
        CategoryService.class,
        ProductImageService.class,
        CacheEvictionService.class
})
class ProductAndCategoryCacheIntegrationTest {

    @TestConfiguration
    @EnableCaching
    static class TestCacheConfig {
        @Bean
        public CacheManager cacheManager() {
            return new ConcurrentMapCacheManager(
                    CacheNames.PRODUCTS_CATALOG,
                    CacheNames.PRODUCT_DETAIL,
                    CacheNames.PRODUCT_CHILDREN,
                    CacheNames.PRODUCT_IMAGES,
                    CacheNames.PRODUCT_SECTIONS,
                    CacheNames.CATEGORIES_LIST,
                    CacheNames.CATEGORY_DETAIL
            );
        }
    }

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductImageService productImageService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private ProductRepository productRepository;

    @MockBean
    private CategoryRepository categoryRepository;

    @MockBean
    private ProductImageRepository productImageRepository;

    @MockBean
    private ProductContentSectionRepository productContentSectionRepository;

    @BeforeEach
    void clearCaches() {
        for (String cacheName : cacheManager.getCacheNames()) {
            Objects.requireNonNull(cacheManager.getCache(cacheName)).clear();
        }
        reset(productRepository, categoryRepository, productImageRepository, productContentSectionRepository);
    }

    private Product createMockProduct(Long id, String name, ProductType type, Product parent) {
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setDescription("Description for " + name);
        p.setPrice(new BigDecimal("100.00"));
        p.setQuantity(10);
        p.setStatus(ProductStatus.AVAILABLE);
        p.setProductType(type);
        p.setParent(parent);
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        return p;
    }

    @Test
    @DisplayName("getProductById should cache standalone, parent, and child product details separately")
    void testGetProductById_CacheHitForAllTypes() {
        Product parent = createMockProduct(10L, "Parent Motors Series", ProductType.PARENT, null);
        Product child = createMockProduct(11L, "Child Motor 2207 1950KV", ProductType.CHILD, parent);

        when(productRepository.findById(10L)).thenReturn(Optional.of(parent));
        when(productRepository.findById(11L)).thenReturn(Optional.of(child));
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());
        when(productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());

        // Call parent product detail
        ProductDto parentDto1 = productService.getProductById(10L);
        ProductDto parentDto2 = productService.getProductById(10L);
        assertEquals("Parent Motors Series", parentDto1.getName());
        assertEquals("Parent Motors Series", parentDto2.getName());
        verify(productRepository, times(1)).findById(10L);

        // Call child product detail
        ProductDto childDto1 = productService.getProductById(11L);
        ProductDto childDto2 = productService.getProductById(11L);
        assertEquals("Child Motor 2207 1950KV", childDto1.getName());
        assertEquals("Child Motor 2207 1950KV", childDto2.getName());
        verify(productRepository, times(1)).findById(11L);
    }

    @Test
    @DisplayName("getChildProducts should cache child product variants for a parent series")
    void testGetChildProducts_CacheHit() {
        Product parent = createMockProduct(20L, "Frames Series", ProductType.PARENT, null);
        Product child1 = createMockProduct(21L, "Frame 5 Inch", ProductType.CHILD, parent);
        Product child2 = createMockProduct(22L, "Frame 7 Inch", ProductType.CHILD, parent);

        when(productRepository.findById(20L)).thenReturn(Optional.of(parent));
        when(productRepository.findByParentIdAndProductType(20L, ProductType.CHILD))
                .thenReturn(Arrays.asList(child1, child2));
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());
        when(productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());

        List<ProductDto> children1 = productService.getChildProducts(20L);
        assertEquals(2, children1.size());

        List<ProductDto> children2 = productService.getChildProducts(20L);
        assertEquals(2, children2.size());

        verify(productRepository, times(1)).findByParentIdAndProductType(20L, ProductType.CHILD);
    }

    @Test
    @DisplayName("getProductImages metadata should cache image DTOs and not hit DB repeatedly")
    void testGetProductImages_CacheHit() {
        Product mockProduct = createMockProduct(30L, "Camera Drone", ProductType.STANDALONE, null);
        ProductImage img = new ProductImage();
        img.setId(100L);
        img.setProduct(mockProduct);
        img.setFileName("drone.jpg");
        img.setMimeType("image/jpeg");
        img.setFileSize(2048L);
        img.setIsPrimary(true);
        img.setDisplayOrder(0);
        img.setCreatedAt(LocalDateTime.now());
        img.setUpdatedAt(LocalDateTime.now());

        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(30L))
                .thenReturn(Collections.singletonList(img));

        List<ProductImageDto> images1 = productImageService.getProductImages(30L);
        assertEquals(1, images1.size());
        assertEquals("drone.jpg", images1.get(0).getFileName());

        List<ProductImageDto> images2 = productImageService.getProductImages(30L);
        assertEquals(1, images2.size());
        assertEquals("drone.jpg", images2.get(0).getFileName());

        verify(productImageRepository, times(1)).findByProductIdOrderByDisplayOrderAsc(30L);
    }

    @Test
    @DisplayName("getContentSections should cache sections and not hit DB repeatedly")
    void testGetContentSections_CacheHit() {
        Product mockProduct = createMockProduct(40L, "GPS Module", ProductType.STANDALONE, null);
        when(productRepository.existsById(40L)).thenReturn(true);

        ProductContentSection section = new ProductContentSection();
        section.setId(500L);
        section.setProduct(mockProduct);
        section.setTitle("Specs");
        section.setContent("Accuracy: 0.5m");
        section.setDisplayOrder(0);
        section.setEnabled(true);
        section.setCreatedAt(LocalDateTime.now());
        section.setUpdatedAt(LocalDateTime.now());

        when(productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(40L))
                .thenReturn(Collections.singletonList(section));

        List<ProductContentSectionDto> sections1 = productService.getContentSections(40L, true);
        assertEquals(1, sections1.size());

        List<ProductContentSectionDto> sections2 = productService.getContentSections(40L, true);
        assertEquals(1, sections2.size());

        verify(productContentSectionRepository, times(1)).findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(40L);
    }

    @Test
    @DisplayName("getAllCategories and getCategoryById should cache results")
    void testCategories_CacheHit() {
        Category cat = new Category("Motors", "FPV Motors");
        cat.setId(1L);
        cat.setCreatedAt(LocalDateTime.now());
        cat.setUpdatedAt(LocalDateTime.now());

        when(categoryRepository.findAll()).thenReturn(Collections.singletonList(cat));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(cat));

        List<CategoryDto> all1 = categoryService.getAllCategories();
        List<CategoryDto> all2 = categoryService.getAllCategories();
        assertEquals(1, all1.size());
        assertEquals(1, all2.size());
        verify(categoryRepository, times(1)).findAll();

        CategoryDto detail1 = categoryService.getCategoryById(1L);
        CategoryDto detail2 = categoryService.getCategoryById(1L);
        assertEquals("Motors", detail1.getName());
        assertEquals("Motors", detail2.getName());
        verify(categoryRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Admin updating child product should invalidate parent children cache and child detail cache")
    void testChildProductUpdate_InvalidatesParentCache() {
        Product parent = createMockProduct(50L, "Parent Drone", ProductType.PARENT, null);
        Product child = createMockProduct(51L, "Child Drone V1", ProductType.CHILD, parent);

        when(productRepository.findById(50L)).thenReturn(Optional.of(parent));
        when(productRepository.findById(51L)).thenReturn(Optional.of(child));
        when(productRepository.findByParentIdAndProductType(50L, ProductType.CHILD))
                .thenReturn(Collections.singletonList(child));
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());
        when(productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());

        // Cache child products for parent 50
        List<ProductDto> initialChildren = productService.getChildProducts(50L);
        assertEquals(1, initialChildren.size());
        assertEquals("Child Drone V1", initialChildren.get(0).getName());

        // Cache child detail for 51
        ProductDto initialChildDetail = productService.getProductById(51L);
        assertEquals("Child Drone V1", initialChildDetail.getName());

        // Update child product
        ProductRequest updateReq = new ProductRequest();
        updateReq.setName("Child Drone V2");
        updateReq.setProductType(ProductType.CHILD);
        updateReq.setParentId(50L);
        updateReq.setPrice(new BigDecimal("199.00"));
        updateReq.setQuantity(25);
        updateReq.setStatus(ProductStatus.AVAILABLE);

        child.setName("Child Drone V2");
        when(productRepository.save(any(Product.class))).thenReturn(child);

        productService.updateProduct(51L, updateReq);

        // Fetch child products again - should fetch fresh from DB
        List<ProductDto> freshChildren = productService.getChildProducts(50L);
        assertEquals("Child Drone V2", freshChildren.get(0).getName());
        verify(productRepository, times(2)).findByParentIdAndProductType(50L, ProductType.CHILD);
    }

    @Test
    @DisplayName("Admin updating category should invalidate category and product catalog caches")
    void testCategoryUpdate_InvalidatesCatalogAndCategoryCache() {
        Category cat = new Category("Old Name", "Desc");
        cat.setId(99L);
        cat.setCreatedAt(LocalDateTime.now());
        cat.setUpdatedAt(LocalDateTime.now());

        when(categoryRepository.findAll()).thenReturn(Collections.singletonList(cat));
        when(categoryRepository.findById(99L)).thenReturn(Optional.of(cat));

        // Cache all categories
        categoryService.getAllCategories();
        categoryService.getCategoryById(99L);

        // Update category
        CategoryRequest req = new CategoryRequest();
        req.setName("New Name");
        req.setDescription("Updated Desc");

        cat.setName("New Name");
        when(categoryRepository.save(any(Category.class))).thenReturn(cat);

        categoryService.updateCategory(99L, req);

        // Cache entries should be cleared
        assertNull(Objects.requireNonNull(cacheManager.getCache(CacheNames.CATEGORIES_LIST)).get("all"));
        assertNull(Objects.requireNonNull(cacheManager.getCache(CacheNames.CATEGORY_DETAIL)).get(99L));
    }

    @Test
    @DisplayName("Cache stampede test: concurrent requests for uncached child product variants invoke DB only once")
    void testChildProductsCacheStampedeProtection() throws InterruptedException, ExecutionException {
        Product parent = createMockProduct(70L, "Stampede Parent", ProductType.PARENT, null);
        Product child = createMockProduct(71L, "Stampede Child", ProductType.CHILD, parent);

        when(productRepository.findById(70L)).thenReturn(Optional.of(parent));
        when(productRepository.findByParentIdAndProductType(70L, ProductType.CHILD)).thenAnswer(inv -> {
            Thread.sleep(40); // Simulate database latency
            return Collections.singletonList(child);
        });
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());
        when(productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(any())).thenReturn(Collections.emptyList());

        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<List<ProductDto>>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                startLatch.await();
                return productService.getChildProducts(70L);
            }));
        }

        startLatch.countDown();

        for (Future<List<ProductDto>> future : futures) {
            List<ProductDto> result = future.get();
            assertEquals(1, result.size());
            assertEquals("Stampede Child", result.get(0).getName());
        }

        executor.shutdown();

        // Query to find children should have executed exactly 1 time across all 10 threads
        verify(productRepository, times(1)).findByParentIdAndProductType(70L, ProductType.CHILD);
    }
}
