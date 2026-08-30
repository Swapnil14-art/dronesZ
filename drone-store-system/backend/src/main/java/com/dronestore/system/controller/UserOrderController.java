package com.dronestore.system.controller;

import com.dronestore.system.dto.CheckoutSummaryDto;
import com.dronestore.system.dto.OrderDto;
import com.dronestore.system.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserOrderController {

    private final OrderService orderService;

    public UserOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/checkout-summary")
    public ResponseEntity<CheckoutSummaryDto> getCheckoutSummary(Authentication authentication) {
        String email = authentication.getName();
        CheckoutSummaryDto summary = orderService.getCheckoutSummary(email);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getUserOrders(Authentication authentication) {
        String email = authentication.getName();
        List<OrderDto> orders = orderService.getUserOrders(email);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDto> getOrderById(Authentication authentication, @PathVariable Long id) {
        String email = authentication.getName();
        OrderDto order = orderService.getOrderById(email, id);
        return ResponseEntity.ok(order);
    }
}
