package com.dronestore.system.controller;

import com.dronestore.system.dto.CartDto;
import com.dronestore.system.dto.CartItemRequest;
import com.dronestore.system.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/user/cart")
public class UserCartController {

    private final CartService cartService;

    public UserCartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartDto> getUserCart(Authentication authentication) {
        String email = authentication.getName();
        CartDto cart = cartService.getUserCart(email);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addItemToCart(Authentication authentication,
                                                 @Valid @RequestBody CartItemRequest request) {
        String email = authentication.getName();
        CartDto updatedCart = cartService.addItemToCart(email, request);
        return ResponseEntity.ok(updatedCart);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartDto> updateCartItemQuantity(Authentication authentication,
                                                          @PathVariable("id") Long id,
                                                          @RequestBody Map<String, Integer> payload) {
        String email = authentication.getName();
        Integer quantity = payload != null ? payload.get("quantity") : 1;
        CartDto updatedCart = cartService.updateCartItemQuantity(email, id, quantity);
        return ResponseEntity.ok(updatedCart);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartDto> removeCartItem(Authentication authentication, @PathVariable("id") Long id) {
        String email = authentication.getName();
        CartDto updatedCart = cartService.removeCartItem(email, id);
        return ResponseEntity.ok(updatedCart);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<CartDto> clearCart(Authentication authentication) {
        String email = authentication.getName();
        CartDto clearedCart = cartService.clearCart(email);
        return ResponseEntity.ok(clearedCart);
    }
}
