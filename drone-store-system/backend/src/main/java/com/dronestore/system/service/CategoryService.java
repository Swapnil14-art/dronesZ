package com.dronestore.system.service;

import com.dronestore.system.config.CacheNames;
import com.dronestore.system.dto.CategoryDto;
import com.dronestore.system.dto.CategoryRequest;
import com.dronestore.system.entity.Category;
import com.dronestore.system.exception.ResourceConflictException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.CategoryRepository;
import com.dronestore.system.repository.ProductRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CacheEvictionService cacheEvictionService;

    public CategoryService(CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           CacheEvictionService cacheEvictionService) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.cacheEvictionService = cacheEvictionService;
    }

    @Cacheable(value = CacheNames.CATEGORIES_LIST, key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findByIsDeletedFalse().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories(boolean includeDeleted) {
        if (!includeDeleted) {
            return getAllCategories();
        }
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = CacheNames.CATEGORY_DETAIL, key = "#id", sync = true)
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));
        return mapToDto(category);
    }

    @Transactional(readOnly = true)
    public CategoryDto getAdminCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));
        return mapToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequest request) {
        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIsDeletedFalse(trimmedName)) {
            throw new ResourceConflictException("An active category with name '" + trimmedName + "' already exists");
        }

        Category category = new Category(trimmedName, request.getDescription());
        category.setIsDeleted(false);
        Category saved = categoryRepository.save(category);
        cacheEvictionService.evictCategoryComplete(saved.getId());
        return mapToDto(saved);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));

        String trimmedName = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(trimmedName, id)) {
            throw new ResourceConflictException("An active category with name '" + trimmedName + "' already exists");
        }

        category.setName(trimmedName);
        category.setDescription(request.getDescription());

        Category updated = categoryRepository.save(category);
        cacheEvictionService.evictCategoryComplete(id);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));

        category.setIsDeleted(true);
        category.setDeletedAt(java.time.LocalDateTime.now());
        categoryRepository.save(category);
        cacheEvictionService.evictCategoryComplete(id);
    }

    @Transactional
    public CategoryDto restoreCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with ID " + id + " not found"));

        if (!Boolean.TRUE.equals(category.getIsDeleted())) {
            throw new com.dronestore.system.exception.BadRequestException("Category is not deleted.");
        }

        if (categoryRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(category.getName(), id)) {
            throw new ResourceConflictException("An active category with name '" + category.getName() + "' already exists.");
        }

        category.setIsDeleted(false);
        category.setDeletedAt(null);
        Category saved = categoryRepository.save(category);
        cacheEvictionService.evictCategoryComplete(id);
        return mapToDto(saved);
    }

    private CategoryDto mapToDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getIsDeleted() != null ? category.getIsDeleted() : false,
                category.getDeletedAt(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
