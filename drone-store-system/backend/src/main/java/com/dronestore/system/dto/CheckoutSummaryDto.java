package com.dronestore.system.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutSummaryDto {

    private CartDto cart;
    private List<UserAddressDto> addresses;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal shippingFee;
    private BigDecimal grandTotal;
    private Boolean canPlaceOrder = false;
    private String placeOrderMessage = "Payment Gateway Integration Pending (Phase 6). Order Placement Disabled until Payment Gateway Connected.";

    public CheckoutSummaryDto() {
    }

    public CheckoutSummaryDto(CartDto cart, List<UserAddressDto> addresses, BigDecimal subtotal,
                              BigDecimal taxAmount, BigDecimal shippingFee, BigDecimal grandTotal) {
        this.cart = cart;
        this.addresses = addresses;
        this.subtotal = subtotal;
        this.taxAmount = taxAmount;
        this.shippingFee = shippingFee;
        this.grandTotal = grandTotal;
        this.canPlaceOrder = false;
        this.placeOrderMessage = "Payment Gateway Integration Pending (Phase 6). Order Placement Disabled until Payment Gateway Connected.";
    }

    public CartDto getCart() {
        return cart;
    }

    public void setCart(CartDto cart) {
        this.cart = cart;
    }

    public List<UserAddressDto> getAddresses() {
        return addresses;
    }

    public void setAddresses(List<UserAddressDto> addresses) {
        this.addresses = addresses;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public Boolean getCanPlaceOrder() {
        return canPlaceOrder;
    }

    public void setCanPlaceOrder(Boolean canPlaceOrder) {
        this.canPlaceOrder = canPlaceOrder;
    }

    public String getPlaceOrderMessage() {
        return placeOrderMessage;
    }

    public void setPlaceOrderMessage(String placeOrderMessage) {
        this.placeOrderMessage = placeOrderMessage;
    }
}
