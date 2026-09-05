package com.dronestore.system.repository;

import com.dronestore.system.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    Optional<ProductImage> findByProductIdAndIsPrimaryTrue(Long productId);

    Optional<ProductImage> findFirstByProductId(Long productId);

    Optional<ProductImage> findFirstByProductIdOrderByDisplayOrderAsc(Long productId);

    Optional<ProductImage> findTopByProductIdOrderByDisplayOrderDesc(Long productId);

    Optional<ProductImage> findByProductIdAndId(Long productId, Long id);

    List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Long productId);

    List<ProductImage> findByProductIdOrderByIsPrimaryDescDisplayOrderAsc(Long productId);

    long countByProductId(Long productId);

    @Query("SELECT pi.imageData FROM ProductImage pi WHERE pi.product.id = :productId ORDER BY pi.isPrimary DESC, pi.displayOrder ASC, pi.id ASC")
    List<byte[]> findImageDataListByProductId(@Param("productId") Long productId);

    @Query("SELECT pi.mimeType FROM ProductImage pi WHERE pi.product.id = :productId ORDER BY pi.isPrimary DESC, pi.displayOrder ASC, pi.id ASC")
    List<String> findMimeTypeListByProductId(@Param("productId") Long productId);

    boolean existsByProductIdAndContentHash(Long productId, String contentHash);

    @Modifying
    void deleteByProductId(Long productId);
}
