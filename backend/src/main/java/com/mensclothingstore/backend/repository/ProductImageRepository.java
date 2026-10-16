package com.mensclothingstore.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.ProductImage;

public interface ProductImageRepository
        extends JpaRepository<ProductImage, Long> {
                void deleteByProduct_ProductId(Long productId);

    List<ProductImage> findByProduct_ProductId(Long productId);

    List<ProductImage> findByProduct_ProductIdOrderByPrimaryDesc(
            Long productId
    );
}