package com.dronestore.system.repository;

import com.dronestore.system.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    Optional<CartItem> findByIdAndCartUserId(Long id, Long userId);
}
