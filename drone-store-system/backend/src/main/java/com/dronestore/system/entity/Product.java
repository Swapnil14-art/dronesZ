package com.dronestore.system.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", length = 20)
    private ProductType productType = ProductType.STANDALONE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Product parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(length = 500)
    private String image;

    @Column(name = "dispatch_time", length = 100)
    private String dispatchTime = "24-48 Hours";

    @Column(length = 100)
    private String warranty = "1-Yr Factory";

    @Column(length = 100)
    private String grade = "Aero Precision";

    @Column(name = "tax_inclusive", nullable = false)
    private Boolean taxInclusive = true;

    @Column(name = "tax_note", length = 150)
    private String taxNote = "GST & Taxes Included";

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<ProductContentSection> contentSections = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Product() {
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.productType == null) {
            this.productType = ProductType.STANDALONE;
        }
        if (this.taxInclusive == null) {
            this.taxInclusive = true;
        }
        if (this.dispatchTime == null) {
            this.dispatchTime = "24-48 Hours";
        }
        if (this.warranty == null) {
            this.warranty = "1-Yr Factory";
        }
        if (this.grade == null) {
            this.grade = "Aero Precision";
        }
        if (this.taxNote == null) {
            this.taxNote = "GST & Taxes Included";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.productType == null) {
            this.productType = ProductType.STANDALONE;
        }
        if (this.taxInclusive == null) {
            this.taxInclusive = true;
        }
        if (this.dispatchTime == null) {
            this.dispatchTime = "24-48 Hours";
        }
        if (this.warranty == null) {
            this.warranty = "1-Yr Factory";
        }
        if (this.grade == null) {
            this.grade = "Aero Precision";
        }
        if (this.taxNote == null) {
            this.taxNote = "GST & Taxes Included";
        }
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

    public Product getParent() {
        return parent;
    }

    public void setParent(Product parent) {
        this.parent = parent;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
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

    public List<ProductContentSection> getContentSections() {
        return contentSections;
    }

    public void setContentSections(List<ProductContentSection> contentSections) {
        this.contentSections = contentSections;
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
