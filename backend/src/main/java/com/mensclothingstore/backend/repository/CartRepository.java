package com.mensclothingstore.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByCustomer_UserId(Long userId);

    boolean existsByCustomer_UserId(Long userId);
}