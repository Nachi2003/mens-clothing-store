package com.mensclothingstore.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.InStoreSale;

public interface InStoreSaleRepository extends JpaRepository<InStoreSale, Long> {

    Optional<InStoreSale> findBySaleNumber(String saleNumber);
}