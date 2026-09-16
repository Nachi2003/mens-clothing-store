package com.mensclothingstore.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    Optional<Invoice> findByOrder_OrderId(Long orderId);

    Optional<Invoice> findBySale_SaleId(Long saleId);
}