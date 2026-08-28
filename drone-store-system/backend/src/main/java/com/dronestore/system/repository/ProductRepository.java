package com.dronestore.system.repository;

import com.dronestore.system.entity.Product;
import com.dronestore.system.entity.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    boolean existsByCategoryId(Long categoryId);

    boolean existsByParentId(Long parentId);

    List<Product> findByParentId(Long parentId);

    List<Product> findByProductTypeIn(List<ProductType> productTypes);

    List<Product> findByParentIdAndProductType(Long parentId, ProductType productType);
}
