package com.dronestore.system.dto;

import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private ProductStatus status;
    private ProductType productType;
    private Long parentId;
    private Long categoryId;
    private String categoryName;
    private String image;
    private String dispatchTime;
    private String warranty;
    private String grade;
    private Boolean taxInclusive;
    private String taxNote;
    private Boolean isAddToCartEnabled = true;
    private List<ProductContentSectionDto> contentSections = new ArrayList<>();
    private List<ProductImageDto> images = new ArrayList<>();
    private ProductImageDto primaryImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProductDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }

    public ProductType getProductType() {
        return productType;
    }

    public void setProductType(ProductType productType) {
        this.productType = productType;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getDispatchTime() {
        return dispatchTime;
    }

    public void setDispatchTime(String dispatchTime) {
        this.dispatchTime = dispatchTime;
    }

    public String getWarranty() {
        return warranty;
    }

    public void setWarranty(String warranty) {
        this.warranty = warranty;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Boolean getTaxInclusive() {
        return taxInclusive;
    }

    public void setTaxInclusive(Boolean taxInclusive) {
        this.taxInclusive = taxInclusive;
    }

    public String getTaxNote() {
        return taxNote;
    }

    public void setTaxNote(String taxNote) {
        this.taxNote = taxNote;
    }

    public Boolean getIsAddToCartEnabled() {
        return isAddToCartEnabled;
    }

    public void setIsAddToCartEnabled(Boolean isAddToCartEnabled) {
        this.isAddToCartEnabled = isAddToCartEnabled;
    }

    public List<ProductContentSectionDto> getContentSections() {
        return contentSections;
    }

    public void setContentSections(List<ProductContentSectionDto> contentSections) {
        this.contentSections = contentSections;
    }

    public List<ProductImageDto> getImages() {
        return images;
    }

    public void setImages(List<ProductImageDto> images) {
        this.images = images;
    }

    public ProductImageDto getPrimaryImage() {
        return primaryImage;
    }

    public void setPrimaryImage(ProductImageDto primaryImage) {
        this.primaryImage = primaryImage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
