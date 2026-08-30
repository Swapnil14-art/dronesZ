package com.dronestore.system.dto;

import com.dronestore.system.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderDto {

    private Long id;
    private String orderNumber;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String deliveryAddress;
    private List<OrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;

    public OrderDto() {
    }

    public OrderDto(Long id, String orderNumber, BigDecimal totalAmount, OrderStatus status,
                    String deliveryAddress, List<OrderItemDto> items, LocalDateTime createdAt) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.deliveryAddress = deliveryAddress;
        this.items = items;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
