package com.mensclothingstore.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}