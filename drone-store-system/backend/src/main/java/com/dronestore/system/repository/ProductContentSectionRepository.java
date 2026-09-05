package com.dronestore.system.repository;

import com.dronestore.system.entity.ProductContentSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductContentSectionRepository extends JpaRepository<ProductContentSection, Long> {

    List<ProductContentSection> findByProductIdOrderByDisplayOrderAsc(Long productId);

    List<ProductContentSection> findByProductIdAndEnabledTrueOrderByDisplayOrderAsc(Long productId);

    void deleteByProductId(Long productId);
}
