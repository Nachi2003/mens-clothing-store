package com.mensclothingstore.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.InStoreSaleItem;

public interface InStoreSaleItemRepository
        extends JpaRepository<InStoreSaleItem, Long> {

    List<InStoreSaleItem> findBySale_SaleId(Long saleId);
}