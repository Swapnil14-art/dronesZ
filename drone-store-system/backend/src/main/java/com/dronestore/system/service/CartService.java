package com.dronestore.system.service;

import com.dronestore.system.dto.CartDto;
import com.dronestore.system.dto.CartItemDto;
import com.dronestore.system.dto.CartItemRequest;
import com.dronestore.system.entity.*;
import com.dronestore.system.exception.BusinessRuleException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.CartItemRepository;
import com.dronestore.system.repository.CartRepository;
import com.dronestore.system.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       UserService userService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional
    public Cart getOrCreateCartEntity(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    @Transactional(readOnly = true)
    public CartDto getUserCart(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (!cartOpt.isPresent()) {
            return new CartDto(null, java.util.Collections.emptyList(), BigDecimal.ZERO, 0);
        }
        return mapToDto(cartOpt.get());
    }

    @Transactional
    public CartDto addItemToCart(String userEmail, CartItemRequest request) {
        User user = userService.getUserByEmail(userEmail);
        Cart cart = getOrCreateCartEntity(user);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        // Rule 1: PARENT products cannot be added to cart directly
        if (product.getProductType() == ProductType.PARENT) {
            throw new BusinessRuleException("Cannot add product series header directly to cart. Please select a specific model variant.");
        }

        // Rule 2: Check availability status
        if (product.getStatus() != ProductStatus.AVAILABLE) {
            throw new BusinessRuleException("Product '" + product.getName() + "' is currently " + product.getStatus().name().replace('_', ' ') + " and cannot be added to cart.");
        }

        // Rule 3: Check stock quantity
        int requestQty = request.getQuantity() != null ? request.getQuantity() : 1;
        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        int currentInCart = existingItemOpt.isPresent() ? existingItemOpt.get().getQuantity() : 0;
        int totalRequested = currentInCart + requestQty;

        if (totalRequested > product.getQuantity()) {
            throw new BusinessRuleException("Requested quantity (" + totalRequested + ") exceeds available stock (" + product.getQuantity() + ") for '" + product.getName() + "'.");
        }

        if (existingItemOpt.isPresent()) {
            CartItem item = existingItemOpt.get();
            item.setQuantity(totalRequested);
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(requestQty);
            cartItemRepository.save(item);
        }

        return getUserCart(userEmail);
    }

    @Transactional
    public CartDto updateCartItemQuantity(String userEmail, Long itemId, Integer quantity) {
        User user = userService.getUserByEmail(userEmail);
        CartItem item = cartItemRepository.findByIdAndCartUserId(itemId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        if (quantity == null || quantity <= 0) {
            cartItemRepository.delete(item);
            return getUserCart(userEmail);
        }

        Product product = item.getProduct();
        if (quantity > product.getQuantity()) {
            throw new BusinessRuleException("Requested quantity (" + quantity + ") exceeds available stock (" + product.getQuantity() + ") for '" + product.getName() + "'.");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
        return getUserCart(userEmail);
    }

    @Transactional
    public CartDto removeCartItem(String userEmail, Long itemId) {
        User user = userService.getUserByEmail(userEmail);
        CartItem item = cartItemRepository.findByIdAndCartUserId(itemId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        cartItemRepository.delete(item);
        return getUserCart(userEmail);
    }

    @Transactional
    public CartDto clearCart(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.getItems().clear();
            cartRepository.save(cart);
        }
        return getUserCart(userEmail);
    }

    public CartDto mapToDto(Cart cart) {
        List<CartItemDto> items = cart.getItems().stream().map(item -> {
            Product p = item.getProduct();
            BigDecimal price = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartItemDto(
                    item.getId(),
                    p.getId(),
                    p.getName(),
                    p.getImage(),
                    price,
                    item.getQuantity(),
                    subtotal,
                    p.getStatus() != null ? p.getStatus().name() : "OUT_OF_STOCK",
                    p.getProductType() != null ? p.getProductType().name() : "STANDALONE",
                    p.getQuantity()
            );
        }).collect(Collectors.toList());

        BigDecimal totalAmount = items.stream()
                .map(CartItemDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = items.stream()
                .mapToInt(CartItemDto::getQuantity)
                .sum();

        return new CartDto(cart.getId(), items, totalAmount, totalItems);
    }
}
