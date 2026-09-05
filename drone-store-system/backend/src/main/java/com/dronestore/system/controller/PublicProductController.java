package com.dronestore.system.controller;

import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class PublicProductController {

    private final ProductService productService;
    private final com.dronestore.system.service.ProductImageService productImageService;

    public PublicProductController(ProductService productService, com.dronestore.system.service.ProductImageService productImageService) {
        this.productService = productService;
        this.productImageService = productImageService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductDto>> getPublicProducts(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) ProductStatus status,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir
    ) {
        PageResponse<ProductDto> response = productService.getPublicProducts(
                page, size, search, status, sortBy, sortDir
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping(value = "/{id}/image", produces = {org.springframework.http.MediaType.IMAGE_JPEG_VALUE, org.springframework.http.MediaType.IMAGE_PNG_VALUE, org.springframework.http.MediaType.ALL_VALUE})
    public ResponseEntity<byte[]> getProductImage(@PathVariable("id") Long id) {
        byte[] imageData = productImageService.getImageDataByProductId(id);
        String mimeType = productImageService.getMimeTypeByProductId(id);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(mimeType))
                .contentLength(imageData.length)
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(imageData);
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<ProductDto>> getChildProducts(@PathVariable("id") Long id) {
        return ResponseEntity.ok(productService.getChildProducts(id));
    }
}
