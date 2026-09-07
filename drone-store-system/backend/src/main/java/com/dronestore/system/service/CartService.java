package com.dronestore.system.service;

import com.dronestore.system.dto.CartDto;
import com.dronestore.system.dto.CartItemDto;
import com.dronestore.system.dto.CartItemRequest;
import com.dronestore.system.entity.*;
import com.dronestore.system.exception.BusinessRuleException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.CartItemRepository;
import com.dronestore.system.repository.CartRepository;
import com.dronestore.system.repository.ProductImageRepository;
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
    private final ProductImageRepository productImageRepository;
    private final UserService userService;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       ProductImageRepository productImageRepository,
                       UserService userService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
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

    @Transactional
    public CartDto getUserCart(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (!cartOpt.isPresent()) {
            return new CartDto(null, java.util.Collections.emptyList(), BigDecimal.ZERO, 0);
        }
        Cart cart = cartOpt.get();

        // Auto-restrict cart quantities to current available stock
        boolean modified = false;
        for (CartItem item : cart.getItems()) {
            Product p = item.getProduct();
            int currentStock = (p != null && p.getQuantity() != null) ? p.getQuantity() : 0;
            if (p != null && p.getStatus() == ProductStatus.AVAILABLE && currentStock > 0) {
                if (item.getQuantity() > currentStock) {
                    item.setQuantity(currentStock);
                    cartItemRepository.save(item);
                    modified = true;
                }
            }
        }
        if (modified) {
            cart = cartRepository.findById(cart.getId()).orElse(cart);
        }

        return mapToDto(cart);
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

        int availableStock = product.getQuantity() != null ? product.getQuantity() : 0;

        // Rule 2: Check availability status and stock
        if (product.getStatus() != ProductStatus.AVAILABLE || availableStock <= 0) {
            throw new BusinessRuleException("Product '" + product.getName() + "' is currently out of stock and cannot be added to cart.");
        }

        // Rule 3: Check stock quantity
        int requestQty = request.getQuantity() != null ? request.getQuantity() : 1;
        if (requestQty <= 0) {
            throw new BusinessRuleException("Quantity must be at least 1.");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        int currentInCart = existingItemOpt.isPresent() ? existingItemOpt.get().getQuantity() : 0;
        int totalRequested = currentInCart + requestQty;

        if (totalRequested > availableStock) {
            if (currentInCart >= availableStock) {
                throw new BusinessRuleException("You already have the maximum available stock (" + availableStock + " units) of '" + product.getName() + "' in your cart.");
            }
            throw new BusinessRuleException("Cannot add " + requestQty + " more units. Total in cart (" + totalRequested + ") would exceed available stock (" + availableStock + ") for '" + product.getName() + "'.");
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
            cart.getItems().add(item);
        }

        return getUserCart(userEmail);
    }

    @Transactional
    public CartDto updateCartItemQuantity(String userEmail, Long itemId, Integer quantity) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (!cartOpt.isPresent()) {
            throw new ResourceNotFoundException("Cart not found for user");
        }
        Cart cart = cartOpt.get();

        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        if (quantity == null || quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
            cartItemRepository.flush();
            cartRepository.saveAndFlush(cart);
            return mapToDto(cart);
        }

        Product product = item.getProduct();
        int availableStock = (product != null && product.getQuantity() != null) ? product.getQuantity() : 0;
        if (product == null || product.getStatus() != ProductStatus.AVAILABLE || availableStock <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
            cartItemRepository.flush();
            cartRepository.saveAndFlush(cart);
            throw new BusinessRuleException("Product '" + (product != null ? product.getName() : "Item") + "' is currently out of stock.");
        }

        if (quantity > availableStock) {
            item.setQuantity(availableStock);
            cartItemRepository.saveAndFlush(item);
            throw new BusinessRuleException("Requested quantity (" + quantity + ") exceeds available stock (" + availableStock + ") for '" + product.getName() + "'. Quantity adjusted to " + availableStock + ".");
        }

        item.setQuantity(quantity);
        cartItemRepository.saveAndFlush(item);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto removeCartItem(String userEmail, Long itemId) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (!cartOpt.isPresent()) {
            throw new ResourceNotFoundException("Cart not found for user");
        }
        Cart cart = cartOpt.get();

        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        cartItemRepository.flush();
        cartRepository.saveAndFlush(cart);

        return mapToDto(cart);
    }

    @Transactional
    public CartDto clearCart(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.getItems().clear();
            cartItemRepository.flush();
            cartRepository.saveAndFlush(cart);
            return mapToDto(cart);
        }
        return getUserCart(userEmail);
    }

    public CartDto mapToDto(Cart cart) {
        List<CartItemDto> items = cart.getItems().stream().map(item -> {
            Product p = item.getProduct();
            BigDecimal price = (p != null && p.getPrice() != null) ? p.getPrice() : BigDecimal.ZERO;
            int stock = (p != null && p.getQuantity() != null) ? p.getQuantity() : 0;
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
            String effectiveStatus = "OUT_OF_STOCK";
            if (p != null) {
                if (p.getStatus() == ProductStatus.AVAILABLE && stock > 0) {
                    effectiveStatus = "AVAILABLE";
                } else if (p.getStatus() == ProductStatus.COMING_SOON) {
                    effectiveStatus = "COMING_SOON";
                }
            }

            // Resolve primary image from ProductImage entity table or parent or product.image
            String itemImage = null;
            if (p != null) {
                List<ProductImage> imgs = productImageRepository.findByProductIdOrderByIsPrimaryDescDisplayOrderAsc(p.getId());
                if (imgs.isEmpty() && p.getParent() != null) {
                    imgs = productImageRepository.findByProductIdOrderByIsPrimaryDescDisplayOrderAsc(p.getParent().getId());
                }
                if (!imgs.isEmpty()) {
                    ProductImage primaryImg = imgs.get(0);
                    long timestamp = primaryImg.getUpdatedAt() != null
                            ? primaryImg.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                            : System.currentTimeMillis();
                    Long ownerId = primaryImg.getProduct() != null ? primaryImg.getProduct().getId() : p.getId();
                    itemImage = "/api/products/" + ownerId + "/images/" + primaryImg.getId() + "?v=" + timestamp;
                } else {
                    itemImage = p.getImage();
                }
            }

            return new CartItemDto(
                    item.getId(),
                    p != null ? p.getId() : null,
                    p != null ? p.getName() : "Unknown Product",
                    itemImage,
                    price,
                    item.getQuantity(),
                    subtotal,
                    effectiveStatus,
                    p != null && p.getProductType() != null ? p.getProductType().name() : "STANDALONE",
                    stock
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
