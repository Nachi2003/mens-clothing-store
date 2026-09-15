package com.mensclothingstore.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.ProductVariant;

public interface ProductVariantRepository
        extends JpaRepository<ProductVariant, Long> {
}