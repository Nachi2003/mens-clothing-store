package com.mensclothingstore.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.Invoice;
import com.mensclothingstore.backend.entity.Order;
import com.mensclothingstore.backend.repository.InStoreSaleRepository;
import com.mensclothingstore.backend.repository.InvoiceRepository;
import com.mensclothingstore.backend.repository.OrderRepository;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InStoreSaleRepository inStoreSaleRepository;
    private final OrderRepository orderRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            InStoreSaleRepository inStoreSaleRepository,
            OrderRepository orderRepository) {

        this.invoiceRepository = invoiceRepository;
        this.inStoreSaleRepository = inStoreSaleRepository;
        this.orderRepository = orderRepository;
    }

    private String generateInvoiceNumber() {

        long nextNumber = invoiceRepository.count() + 1;

        return String.format("INV-%06d", nextNumber);
    }

    @Transactional
    public Invoice createInvoiceForSale(Long saleId) {

        InStoreSale sale = inStoreSaleRepository.findById(saleId)
                .orElseThrow(() ->
                        new RuntimeException("Sale not found")
                );

        if (invoiceRepository.findBySale_SaleId(saleId).isPresent()) {
            throw new RuntimeException(
                    "Invoice already exists for this sale"
            );
        }

        Invoice invoice = new Invoice();

        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setSale(sale);
        invoice.setIssuedAt(java.time.LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice createInvoiceForOrder(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found")
                );

        if (invoiceRepository.findByOrder_OrderId(orderId).isPresent()) {
            throw new RuntimeException(
                    "Invoice already exists for this order"
            );
        }

        Invoice invoice = new Invoice();

        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setOrder(order);
        invoice.setIssuedAt(java.time.LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }
}