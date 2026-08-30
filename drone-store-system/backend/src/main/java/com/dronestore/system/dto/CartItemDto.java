package com.dronestore.system.dto;

import java.math.BigDecimal;

public class CartItemDto {

    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal subtotal;
    private String status;
    private String productType;
    private Integer stockAvailable;

    public CartItemDto() {
    }

    public CartItemDto(Long id, Long productId, String productName, String productImage, BigDecimal price,
                       Integer quantity, BigDecimal subtotal, String status, String productType, Integer stockAvailable) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productImage = productImage;
        this.price = price;
        this.quantity = quantity;
        this.subtotal = subtotal;
        this.status = status;
        this.productType = productType;
        this.stockAvailable = stockAvailable;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
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

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public Integer getStockAvailable() {
        return stockAvailable;
    }

    public void setStockAvailable(Integer stockAvailable) {
        this.stockAvailable = stockAvailable;
    }
}
