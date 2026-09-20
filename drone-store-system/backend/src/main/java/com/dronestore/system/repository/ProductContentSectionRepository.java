package com.dronestore.system.repository;

import com.dronestore.system.entity.ProductContentSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductContentSectionRepository extends JpaRepository<ProductContentSection, Long> {

    List<ProductContentSection> findByProductIdOrderByDisplayOrderAsc(Long productId);

    List<ProductContentSection> findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(Long productId);

    @org.springframework.data.jpa.repository.Query("SELECT new com.dronestore.system.dto.ProductContentSectionDto(pcs.id, pcs.product.id, pcs.title, pcs.type, pcs.content, pcs.displayOrder, pcs.enabled, pcs.createdAt, pcs.updatedAt) FROM ProductContentSection pcs WHERE pcs.product.id IN :productIds AND pcs.enabled = true ORDER BY pcs.displayOrder ASC, pcs.id ASC")
    List<com.dronestore.system.dto.ProductContentSectionDto> findSectionDtosByProductIdInAndEnabledTrue(@org.springframework.data.repository.query.Param("productIds") java.util.Collection<Long> productIds);

    @org.springframework.data.jpa.repository.Query("SELECT new com.dronestore.system.dto.ProductContentSectionDto(pcs.id, pcs.product.id, pcs.title, pcs.type, pcs.content, pcs.displayOrder, pcs.enabled, pcs.createdAt, pcs.updatedAt) FROM ProductContentSection pcs WHERE pcs.product.id IN :productIds ORDER BY pcs.displayOrder ASC, pcs.id ASC")
    List<com.dronestore.system.dto.ProductContentSectionDto> findSectionDtosByProductIdIn(@org.springframework.data.repository.query.Param("productIds") java.util.Collection<Long> productIds);

    @org.springframework.data.jpa.repository.Query("SELECT new com.dronestore.system.dto.ProductContentSectionDto(pcs.id, pcs.product.id, pcs.title, pcs.type, pcs.content, pcs.displayOrder, pcs.enabled, pcs.createdAt, pcs.updatedAt) FROM ProductContentSection pcs WHERE pcs.product.id = :productId AND pcs.enabled = true ORDER BY pcs.displayOrder ASC, pcs.id ASC")
    List<com.dronestore.system.dto.ProductContentSectionDto> findSectionDtosByProductIdAndEnabledTrue(@org.springframework.data.repository.query.Param("productId") Long productId);

    void deleteByProductId(Long productId);

}
