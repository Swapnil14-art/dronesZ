package com.dronestore.system.dto;

import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;

import javax.validation.Valid;
import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;

    private String description;

    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    private BigDecimal price;

    @Min(value = 0, message = "Quantity must be non-negative")
    private Integer quantity;

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    @NotNull(message = "Product type is required (STANDALONE, PARENT, CHILD)")
    private ProductType productType;

    private Long parentId;

    private Long categoryId;

    private String image;

    private String dispatchTime;

    private String warranty;

    private String grade;

    private Boolean taxInclusive;

    private String taxNote;

    private Boolean isAddToCartEnabled;

    @Valid
    private List<ProductContentSectionRequest> contentSections;

    public ProductRequest() {
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

    public List<ProductContentSectionRequest> getContentSections() {
        return contentSections;
    }

    public void setContentSections(List<ProductContentSectionRequest> contentSections) {
        this.contentSections = contentSections;
    }
}
