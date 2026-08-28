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
public class PublicProductController {

    private final ProductService productService;

    public PublicProductController(ProductService productService) {
        this.productService = productService;
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

    @GetMapping("/{id}/children")
    public ResponseEntity<List<ProductDto>> getChildProducts(@PathVariable("id") Long id) {
        return ResponseEntity.ok(productService.getChildProducts(id));
    }
}
