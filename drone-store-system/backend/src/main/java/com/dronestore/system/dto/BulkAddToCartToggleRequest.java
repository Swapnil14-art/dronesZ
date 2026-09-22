package com.dronestore.system.dto;

import javax.validation.constraints.NotNull;
import java.util.List;

public class BulkAddToCartToggleRequest {

    private List<Long> productIds;

    @NotNull(message = "Enabled state is required")
    private Boolean enabled;

    private Boolean allProducts;

    public BulkAddToCartToggleRequest() {
    }

    public BulkAddToCartToggleRequest(List<Long> productIds, Boolean enabled, Boolean allProducts) {
        this.productIds = productIds;
        this.enabled = enabled;
        this.allProducts = allProducts;
    }

    public List<Long> getProductIds() {
        return productIds;
    }

    public void setProductIds(List<Long> productIds) {
        this.productIds = productIds;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getAllProducts() {
        return allProducts;
    }

    public void setAllProducts(Boolean allProducts) {
        this.allProducts = allProducts;
    }
}
