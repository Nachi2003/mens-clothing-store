package com.mensclothingstore.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.StockMovement;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
}