package com.dronestore.system.service;

import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.dto.ProductRequest;
import com.dronestore.system.entity.Category;
import com.dronestore.system.entity.Product;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.exception.BadRequestException;
import com.dronestore.system.exception.ResourceConflictException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.CategoryRepository;
import com.dronestore.system.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductDto> getProducts(int page, int size, String search, ProductStatus status,
                                                Long categoryId, Long parentId, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (parentId != null) {
                predicates.add(cb.equal(root.get("parent").get("id"), parentId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<ProductDto> content = productPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));
        return mapToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + request.getCategoryId() + " not found"));
        }

        Product parent = null;
        if (request.getParentId() != null) {
            parent = productRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + request.getParentId() + " not found"));

            if (parent.getParent() != null) {
                throw new BadRequestException("Parent product cannot be a child variant (maximum hierarchy depth is 1)");
            }
        }

        Product product = new Product();
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setStatus(request.getStatus());
        product.setCategory(category);
        product.setParent(parent);
        product.setImage(request.getImage());

        Product saved = productRepository.save(product);
        return mapToDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("A product cannot be its own parent");
            }

            Product parent = productRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + request.getParentId() + " not found"));

            if (parent.getParent() != null) {
                throw new BadRequestException("Parent product cannot be a child variant (maximum hierarchy depth is 1)");
            }

            // Check circular dependency: if requested parent is a child of the current product
            if (isChildOf(parent, id)) {
                throw new ResourceConflictException("Circular parent-child relationship detected: Product ID " + request.getParentId() + " is already a child of Product ID " + id);
            }

            product.setParent(parent);
        } else {
            product.setParent(null);
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + request.getCategoryId() + " not found"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setStatus(request.getStatus());
        product.setImage(request.getImage());

        Product updated = productRepository.save(product);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));

        if (productRepository.existsByParentId(id)) {
            throw new ResourceConflictException("Cannot delete product ID " + id + " because child products are associated with it. Reassign or delete child products first.");
        }

        productRepository.delete(product);
    }

    private boolean isChildOf(Product potentialParent, Long targetAncestorId) {
        Product current = potentialParent;
        while (current != null) {
            if (targetAncestorId.equals(current.getId())) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    private ProductDto mapToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setQuantity(product.getQuantity());
        dto.setStatus(product.getStatus());
        dto.setImage(product.getImage());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }

        if (product.getParent() != null) {
            dto.setParentId(product.getParent().getId());
        }

        return dto;
    }
}
