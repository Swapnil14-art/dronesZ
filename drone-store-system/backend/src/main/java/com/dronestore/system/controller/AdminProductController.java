package com.dronestore.system.controller;

import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductContentSectionDto;
import com.dronestore.system.dto.ProductContentSectionRequest;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.dto.ProductImageDto;
import com.dronestore.system.dto.ProductRequest;
import com.dronestore.system.dto.ReorderImagesRequest;
import com.dronestore.system.dto.ReorderSectionsRequest;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;
import com.dronestore.system.service.ProductImageService;
import com.dronestore.system.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    public AdminProductController(ProductService productService, ProductImageService productImageService) {
        this.productService = productService;
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductDto>> getProducts(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "status", required = false) ProductStatus status,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "parentId", required = false) Long parentId,
            @RequestParam(name = "productType", required = false) ProductType productType,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "desc") String sortDir,
            @RequestParam(name = "includeArchived", defaultValue = "false") boolean includeArchived) {

        PageResponse<ProductDto> response = productService.getProducts(
                page, size, search, status, categoryId, parentId, productType, sortBy, sortDir, includeArchived);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        ProductDto product = productService.getAdminProductById(id);
        return ResponseEntity.ok(product);
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductDto created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable("id") Long id, @Valid @RequestBody ProductRequest request) {
        ProductDto updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(updated);
    }

    // ================= Product Images Endpoints =================

    @GetMapping("/{id}/images")
    public ResponseEntity<List<ProductImageDto>> getProductImages(@PathVariable("id") Long id) {
        List<ProductImageDto> images = productImageService.getProductImages(id);
        return ResponseEntity.ok(images);
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<List<ProductImageDto>> uploadMultipleProductImages(
            @PathVariable("id") Long id,
            @RequestParam("files") List<MultipartFile> files) {
        List<ProductImageDto> images = productImageService.uploadMultipleProductImages(id, files);
        return ResponseEntity.ok(images);
    }

    @PutMapping("/{id}/images/reorder")
    public ResponseEntity<List<ProductImageDto>> reorderProductImages(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReorderImagesRequest request) {
        List<ProductImageDto> reordered = productImageService.reorderImages(id, request.getImageIds());
        return ResponseEntity.ok(reordered);
    }

    @PatchMapping("/{id}/images/{imageId}/primary")
    public ResponseEntity<ProductImageDto> setPrimaryProductImage(
            @PathVariable("id") Long id,
            @PathVariable("imageId") Long imageId) {
        ProductImageDto primary = productImageService.setPrimaryImage(id, imageId);
        return ResponseEntity.ok(primary);
    }

    @PutMapping("/{id}/images/{imageId}")
    public ResponseEntity<ProductImageDto> replaceProductImage(
            @PathVariable("id") Long id,
            @PathVariable("imageId") Long imageId,
            @RequestParam("file") MultipartFile file) {
        ProductImageDto replaced = productImageService.replaceImage(id, imageId, file);
        return ResponseEntity.ok(replaced);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deleteSpecificProductImage(
            @PathVariable("id") Long id,
            @PathVariable("imageId") Long imageId) {
        productImageService.deleteImage(id, imageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<ProductDto> uploadOrReplaceProductImage(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        productImageService.uploadOrReplaceProductImage(id, file);
        ProductDto updatedProduct = productService.getAdminProductById(id);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}/image")
    public ResponseEntity<Void> deleteProductImage(@PathVariable("id") Long id) {
        productImageService.deleteProductImage(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ProductDto> restoreProduct(@PathVariable("id") Long id) {
        ProductDto restored = productService.restoreProduct(id);
        return ResponseEntity.ok(restored);
    }

    // ================= Dynamic Content Sections Endpoints =================

    @GetMapping("/{id}/content-sections")
    public ResponseEntity<List<ProductContentSectionDto>> getContentSections(@PathVariable("id") Long id) {
        List<ProductContentSectionDto> sections = productService.getContentSections(id, false);
        return ResponseEntity.ok(sections);
    }

    @PostMapping("/{id}/content-sections")
    public ResponseEntity<ProductContentSectionDto> addContentSection(
            @PathVariable("id") Long id,
            @Valid @RequestBody ProductContentSectionRequest request) {
        ProductContentSectionDto created = productService.addContentSection(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/content-sections/{sectionId}")
    public ResponseEntity<ProductContentSectionDto> updateContentSection(
            @PathVariable("id") Long id,
            @PathVariable("sectionId") Long sectionId,
            @Valid @RequestBody ProductContentSectionRequest request) {
        ProductContentSectionDto updated = productService.updateContentSection(id, sectionId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/content-sections/{sectionId}")
    public ResponseEntity<Void> deleteContentSection(
            @PathVariable("id") Long id,
            @PathVariable("sectionId") Long sectionId) {
        productService.deleteContentSection(id, sectionId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/content-sections/reorder")
    public ResponseEntity<List<ProductContentSectionDto>> reorderContentSections(
            @PathVariable("id") Long id,
            @RequestBody ReorderSectionsRequest request) {
        List<ProductContentSectionDto> reordered = productService.reorderContentSections(id, request.getSectionIds());
        return ResponseEntity.ok(reordered);
    }

    @PatchMapping("/{id}/content-sections/{sectionId}/toggle")
    public ResponseEntity<ProductContentSectionDto> toggleContentSection(
            @PathVariable("id") Long id,
            @PathVariable("sectionId") Long sectionId) {
        ProductContentSectionDto toggled = productService.toggleContentSection(id, sectionId);
        return ResponseEntity.ok(toggled);
    }
}
