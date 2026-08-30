package com.dronestore.system.service;

import com.dronestore.system.dto.*;
import com.dronestore.system.entity.Order;
import com.dronestore.system.entity.User;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final UserAddressService addressService;
    private final UserService userService;

    public OrderService(OrderRepository orderRepository,
                        CartService cartService,
                        UserAddressService addressService,
                        UserService userService) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.addressService = addressService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public CheckoutSummaryDto getCheckoutSummary(String userEmail) {
        CartDto cart = cartService.getUserCart(userEmail);
        List<UserAddressDto> addresses = addressService.getUserAddresses(userEmail);

        BigDecimal subtotal = cart.getTotalAmount() != null ? cart.getTotalAmount() : BigDecimal.ZERO;
        
        // Calculate estimated GST tax (18%) and shipping fee
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingFee = (subtotal.compareTo(new BigDecimal("5000")) >= 0 || subtotal.compareTo(BigDecimal.ZERO) == 0)
                ? BigDecimal.ZERO
                : new BigDecimal("150.00");

        BigDecimal grandTotal = subtotal.add(taxAmount).add(shippingFee).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutSummaryDto(cart, addresses, subtotal, taxAmount, shippingFee, grandTotal);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(String userEmail, Long orderId) {
        User user = userService.getUserByEmail(userEmail);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        return mapToDto(order);
    }

    public OrderDto mapToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems().stream().map(item -> new OrderItemDto(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProductName(),
                item.getPrice(),
                item.getQuantity(),
                item.getSubtotal()
        )).collect(Collectors.toList());

        return new OrderDto(
                order.getId(),
                order.getOrderNumber(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getDeliveryAddress(),
                itemDtos,
                order.getCreatedAt()
        );
    }
}
