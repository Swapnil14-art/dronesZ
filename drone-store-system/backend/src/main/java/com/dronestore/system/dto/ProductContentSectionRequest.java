package com.dronestore.system.dto;

import com.dronestore.system.entity.ProductContentSectionType;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class ProductContentSectionRequest {

    private Long id;

    @NotBlank(message = "Section title is required")
    @Size(max = 255, message = "Section title cannot exceed 255 characters")
    private String title;

    @NotNull(message = "Section type is required (WORD, EXCEL)")
    private ProductContentSectionType type;

    @NotBlank(message = "Section content is required")
    private String content;

    private Integer displayOrder;

    private Boolean enabled;

    public ProductContentSectionRequest() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public ProductContentSectionType getType() {
        return type;
    }

    public void setType(ProductContentSectionType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
