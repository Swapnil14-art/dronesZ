package com.dronestore.system.service;

import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductContentSectionDto;
import com.dronestore.system.dto.ProductContentSectionRequest;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.dto.ProductImageDto;
import com.dronestore.system.dto.ProductRequest;
import com.dronestore.system.entity.Category;
import com.dronestore.system.entity.Product;
import com.dronestore.system.entity.ProductContentSection;
import com.dronestore.system.entity.ProductImage;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;
import com.dronestore.system.exception.BadRequestException;
import com.dronestore.system.exception.ResourceConflictException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.CategoryRepository;
import com.dronestore.system.repository.ProductContentSectionRepository;
import com.dronestore.system.repository.ProductImageRepository;
import com.dronestore.system.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductContentSectionRepository productContentSectionRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          ProductImageRepository productImageRepository,
                          ProductContentSectionRepository productContentSectionRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
        this.productContentSectionRepository = productContentSectionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductDto> getProducts(int page, int size, String search, ProductStatus status,
                                                Long categoryId, Long parentId, ProductType productType,
                                                String sortBy, String sortDir) {
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

            if (productType != null) {
                predicates.add(cb.equal(root.get("productType"), productType));
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
                .map(p -> mapToDto(p, false))
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
    public PageResponse<ProductDto> getPublicProducts(int page, int size, String search, ProductStatus status,
                                                      String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(root.get("productType").in(Arrays.asList(ProductType.STANDALONE, ProductType.PARENT)));

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<ProductDto> content = productPage.getContent().stream()
                .map(p -> mapToDto(p, true))
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
        return mapToDto(product, true);
    }

    @Transactional(readOnly = true)
    public ProductDto getAdminProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));
        return mapToDto(product, false);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getChildProducts(Long parentId) {
        Product parent = productRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + parentId + " not found"));

        if (parent.getProductType() != ProductType.PARENT) {
            throw new BadRequestException("Product ID " + parentId + " is not a PARENT product series.");
        }

        return productRepository.findByParentIdAndProductType(parentId, ProductType.CHILD).stream()
                .map(p -> mapToDto(p, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        validateProductRules(request, null);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + request.getCategoryId() + " not found"));
        }

        Product parent = null;
        if (request.getProductType() == ProductType.CHILD && request.getParentId() != null) {
            parent = productRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + request.getParentId() + " not found"));
        }

        Product product = new Product();
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setProductType(request.getProductType());
        product.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
        product.setQuantity(request.getQuantity() != null ? request.getQuantity() : 0);
        product.setStatus(request.getStatus());
        product.setCategory(category);
        product.setParent(parent);
        product.setImage(request.getImage());

        product.setDispatchTime(request.getDispatchTime() != null && !request.getDispatchTime().trim().isEmpty() ? request.getDispatchTime().trim() : "24-48 Hours");
        product.setWarranty(request.getWarranty() != null && !request.getWarranty().trim().isEmpty() ? request.getWarranty().trim() : "1-Yr Factory");
        product.setGrade(request.getGrade() != null && !request.getGrade().trim().isEmpty() ? request.getGrade().trim() : "Aero Precision");
        product.setTaxInclusive(request.getTaxInclusive() != null ? request.getTaxInclusive() : true);
        product.setTaxNote(request.getTaxNote() != null && !request.getTaxNote().trim().isEmpty() ? request.getTaxNote().trim() : "GST & Taxes Included");

        Product saved = productRepository.save(product);

        if (request.getContentSections() != null && !request.getContentSections().isEmpty()) {
            int order = 0;
            for (ProductContentSectionRequest sectionReq : request.getContentSections()) {
                ProductContentSection section = new ProductContentSection();
                section.setProduct(saved);
                section.setTitle(sectionReq.getTitle().trim());
                section.setType(sectionReq.getType());
                section.setContent(sectionReq.getContent());
                section.setDisplayOrder(sectionReq.getDisplayOrder() != null ? sectionReq.getDisplayOrder() : order);
                section.setEnabled(sectionReq.getEnabled() != null ? sectionReq.getEnabled() : true);
                productContentSectionRepository.save(section);
                order++;
            }
        }

        return mapToDto(saved, false);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));

        validateProductRules(request, product);

        if (product.getProductType() == ProductType.PARENT && request.getProductType() != ProductType.PARENT) {
            if (productRepository.existsByParentId(id)) {
                throw new ResourceConflictException("Cannot change product type of PARENT product ID " + id + " because it has associated child products.");
            }
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + request.getCategoryId() + " not found"));
        }

        Product parent = null;
        if (request.getProductType() == ProductType.CHILD && request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("A product cannot be its own parent.");
            }
            parent = productRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + request.getParentId() + " not found"));

            if (isChildOf(parent, id)) {
                throw new ResourceConflictException("Circular parent-child relationship detected: Product ID " + request.getParentId() + " is already a child of Product ID " + id);
            }
        }

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setProductType(request.getProductType());
        product.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO);
        product.setQuantity(request.getQuantity() != null ? request.getQuantity() : 0);
        product.setStatus(request.getStatus());
        product.setCategory(category);
        product.setParent(parent);
        product.setImage(request.getImage());

        product.setDispatchTime(request.getDispatchTime() != null && !request.getDispatchTime().trim().isEmpty() ? request.getDispatchTime().trim() : "24-48 Hours");
        product.setWarranty(request.getWarranty() != null && !request.getWarranty().trim().isEmpty() ? request.getWarranty().trim() : "1-Yr Factory");
        product.setGrade(request.getGrade() != null && !request.getGrade().trim().isEmpty() ? request.getGrade().trim() : "Aero Precision");
        product.setTaxInclusive(request.getTaxInclusive() != null ? request.getTaxInclusive() : true);
        product.setTaxNote(request.getTaxNote() != null && !request.getTaxNote().trim().isEmpty() ? request.getTaxNote().trim() : "GST & Taxes Included");

        // Sync content sections if provided in request
        if (request.getContentSections() != null) {
            productContentSectionRepository.deleteByProductId(id);
            int order = 0;
            for (ProductContentSectionRequest sectionReq : request.getContentSections()) {
                ProductContentSection section = new ProductContentSection();
                section.setProduct(product);
                section.setTitle(sectionReq.getTitle().trim());
                section.setType(sectionReq.getType());
                section.setContent(sectionReq.getContent());
                section.setDisplayOrder(sectionReq.getDisplayOrder() != null ? sectionReq.getDisplayOrder() : order);
                section.setEnabled(sectionReq.getEnabled() != null ? sectionReq.getEnabled() : true);
                productContentSectionRepository.save(section);
                order++;
            }
        }

        Product updated = productRepository.save(product);
        return mapToDto(updated, false);
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

    // ----------------- Content Sections CRUD & Reordering -----------------

    @Transactional(readOnly = true)
    public List<ProductContentSectionDto> getContentSections(Long productId, boolean onlyEnabled) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product with ID " + productId + " not found");
        }

        List<ProductContentSection> sections = onlyEnabled
                ? productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(productId)
                : productContentSectionRepository.findByProductIdOrderByDisplayOrderAsc(productId);

        return sections.stream().map(this::mapSectionToDto).collect(Collectors.toList());
    }

    @Transactional
    public ProductContentSectionDto addContentSection(Long productId, ProductContentSectionRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

        ProductContentSection section = new ProductContentSection();
        section.setProduct(product);
        section.setTitle(request.getTitle().trim());
        section.setType(request.getType());
        section.setContent(request.getContent());

        if (request.getDisplayOrder() != null) {
            section.setDisplayOrder(request.getDisplayOrder());
        } else {
            List<ProductContentSection> existing = productContentSectionRepository.findByProductIdOrderByDisplayOrderAsc(productId);
            section.setDisplayOrder(existing.size());
        }

        section.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

        ProductContentSection saved = productContentSectionRepository.save(section);
        return mapSectionToDto(saved);
    }

    @Transactional
    public ProductContentSectionDto updateContentSection(Long productId, Long sectionId, ProductContentSectionRequest request) {
        ProductContentSection section = productContentSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Content section with ID " + sectionId + " not found"));

        if (!section.getProduct().getId().equals(productId)) {
            throw new BadRequestException("Content section does not belong to product ID " + productId);
        }

        section.setTitle(request.getTitle().trim());
        section.setType(request.getType());
        section.setContent(request.getContent());
        if (request.getDisplayOrder() != null) {
            section.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getEnabled() != null) {
            section.setEnabled(request.getEnabled());
        }

        ProductContentSection updated = productContentSectionRepository.save(section);
        return mapSectionToDto(updated);
    }

    @Transactional
    public void deleteContentSection(Long productId, Long sectionId) {
        ProductContentSection section = productContentSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Content section with ID " + sectionId + " not found"));

        if (!section.getProduct().getId().equals(productId)) {
            throw new BadRequestException("Content section does not belong to product ID " + productId);
        }

        productContentSectionRepository.delete(section);
    }

    @Transactional
    public List<ProductContentSectionDto> reorderContentSections(Long productId, List<Long> sectionIds) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product with ID " + productId + " not found");
        }

        List<ProductContentSection> sections = productContentSectionRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        for (int i = 0; i < sectionIds.size(); i++) {
            Long sId = sectionIds.get(i);
            for (ProductContentSection s : sections) {
                if (s.getId().equals(sId)) {
                    s.setDisplayOrder(i);
                    productContentSectionRepository.save(s);
                    break;
                }
            }
        }

        return productContentSectionRepository.findByProductIdOrderByDisplayOrderAsc(productId).stream()
                .map(this::mapSectionToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductContentSectionDto toggleContentSection(Long productId, Long sectionId) {
        ProductContentSection section = productContentSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Content section with ID " + sectionId + " not found"));

        if (!section.getProduct().getId().equals(productId)) {
            throw new BadRequestException("Content section does not belong to product ID " + productId);
        }

        section.setEnabled(!Boolean.TRUE.equals(section.getEnabled()));
        ProductContentSection updated = productContentSectionRepository.save(section);
        return mapSectionToDto(updated);
    }

    // ----------------- Helper Mapping Methods -----------------

    private void validateProductRules(ProductRequest request, Product existingProduct) {
        ProductType type = request.getProductType();
        if (type == null) {
            throw new BadRequestException("Product type is required.");
        }

        if (type == ProductType.STANDALONE) {
            if (request.getParentId() != null) {
                throw new BadRequestException("STANDALONE products cannot have a parent product.");
            }
        } else if (type == ProductType.PARENT) {
            if (request.getParentId() != null) {
                throw new BadRequestException("PARENT products cannot have a parent product.");
            }
        } else if (type == ProductType.CHILD) {
            if (request.getParentId() == null) {
                throw new BadRequestException("CHILD products must specify a valid PARENT product.");
            }
            Product parent = productRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent product with ID " + request.getParentId() + " not found"));
            if (parent.getProductType() != ProductType.PARENT) {
                throw new BadRequestException("Parent product must be of type PARENT.");
            }
        }
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

    public ProductDto mapToDto(Product product, boolean onlyEnabledSections) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setQuantity(product.getQuantity());
        dto.setStatus(product.getStatus());
        dto.setProductType(product.getProductType());

        dto.setDispatchTime(product.getDispatchTime() != null ? product.getDispatchTime() : "24-48 Hours");
        dto.setWarranty(product.getWarranty() != null ? product.getWarranty() : "1-Yr Factory");
        dto.setGrade(product.getGrade() != null ? product.getGrade() : "Aero Precision");
        dto.setTaxInclusive(product.getTaxInclusive() != null ? product.getTaxInclusive() : true);
        dto.setTaxNote(product.getTaxNote() != null ? product.getTaxNote() : "GST & Taxes Included");

        // Fetch ordered images
        List<ProductImage> imageEntities = productImageRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
        List<ProductImageDto> imageDtos = imageEntities.stream().map(this::mapImageToDto).collect(Collectors.toList());
        dto.setImages(imageDtos);

        ProductImageDto primaryDto = imageDtos.stream()
                .filter(imgDto -> Boolean.TRUE.equals(imgDto.getIsPrimary()))
                .findFirst()
                .orElse(imageDtos.isEmpty() ? null : imageDtos.get(0));
        dto.setPrimaryImage(primaryDto);

        String img = primaryDto != null ? primaryDto.getUrl() : product.getImage();
        if (img != null && img.startsWith("/api/products/") && !img.contains("?")) {
            long timestamp = product.getUpdatedAt() != null ? product.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond() : System.currentTimeMillis();
            img = img + "?v=" + timestamp;
        }
        dto.setImage(img);
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }

        if (product.getParent() != null) {
            dto.setParentId(product.getParent().getId());
        }

        // Fetch sections
        List<ProductContentSection> sections = onlyEnabledSections
                ? productContentSectionRepository.findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(product.getId())
                : productContentSectionRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());

        if (sections != null) {
            dto.setContentSections(sections.stream().map(this::mapSectionToDto).collect(Collectors.toList()));
        }

        return dto;
    }

    public ProductImageDto mapImageToDto(ProductImage img) {
        ProductImageDto dto = new ProductImageDto();
        dto.setId(img.getId());
        dto.setProductId(img.getProduct() != null ? img.getProduct().getId() : null);

        long timestamp = img.getUpdatedAt() != null
                ? img.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                : System.currentTimeMillis();

        dto.setUrl("/api/products/" + (img.getProduct() != null ? img.getProduct().getId() : 0) + "/images/" + img.getId() + "?v=" + timestamp);
        dto.setFileName(img.getFileName());
        dto.setFileSize(img.getFileSize());
        dto.setMimeType(img.getMimeType());
        dto.setIsPrimary(Boolean.TRUE.equals(img.getIsPrimary()));
        dto.setDisplayOrder(img.getDisplayOrder() != null ? img.getDisplayOrder() : 0);
        dto.setCreatedAt(img.getCreatedAt());
        dto.setUpdatedAt(img.getUpdatedAt());
        return dto;
    }

    public ProductContentSectionDto mapSectionToDto(ProductContentSection section) {
        ProductContentSectionDto dto = new ProductContentSectionDto();
        dto.setId(section.getId());
        dto.setProductId(section.getProduct() != null ? section.getProduct().getId() : null);
        dto.setTitle(section.getTitle());
        dto.setType(section.getType());
        dto.setContent(section.getContent());
        dto.setDisplayOrder(section.getDisplayOrder());
        dto.setEnabled(section.getEnabled());
        dto.setCreatedAt(section.getCreatedAt());
        dto.setUpdatedAt(section.getUpdatedAt());
        return dto;
    }
}
