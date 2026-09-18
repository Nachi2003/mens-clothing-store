package com.mensclothingstore.backend.service;

import com.mensclothingstore.backend.dto.InvoiceResponse;
import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.Invoice;
import com.mensclothingstore.backend.entity.InvoiceSequence;
import com.mensclothingstore.backend.entity.Order;
import com.mensclothingstore.backend.repository.InStoreSaleRepository;
import com.mensclothingstore.backend.repository.InvoiceRepository;
import com.mensclothingstore.backend.repository.InvoiceSequenceRepository;
import com.mensclothingstore.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InStoreSaleRepository inStoreSaleRepository;
    private final OrderRepository orderRepository;
    private final InvoiceSequenceRepository invoiceSequenceRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            InStoreSaleRepository inStoreSaleRepository,
            OrderRepository orderRepository,
            InvoiceSequenceRepository invoiceSequenceRepository) {

        this.invoiceRepository = invoiceRepository;
        this.inStoreSaleRepository = inStoreSaleRepository;
        this.orderRepository = orderRepository;
        this.invoiceSequenceRepository = invoiceSequenceRepository;
    }

    private String generateInvoiceNumber() {

        InvoiceSequence sequence =
                invoiceSequenceRepository.findBySequenceIdForUpdate(1L);

        if (sequence == null) {
            throw new RuntimeException(
                    "Invoice sequence not found"
            );
        }

        long number = sequence.getNextNumber();

        sequence.setNextNumber(number + 1);

        invoiceSequenceRepository.save(sequence);

        return String.format("INV-%06d", number);
    }

    @Transactional
    public InvoiceResponse createInvoiceForSale(Long saleId) {

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

        Invoice savedInvoice = invoiceRepository.save(invoice);

        return new InvoiceResponse(
                savedInvoice.getInvoiceId(),
                savedInvoice.getInvoiceNumber(),
                savedInvoice.getIssuedAt(),
                null,
                null,
                sale.getSaleId(),
                sale.getSaleNumber(),
                sale.getTotalAmount()
        );
    }

    @Transactional
    public InvoiceResponse createInvoiceForOrder(Long orderId) {

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

        Invoice savedInvoice = invoiceRepository.save(invoice);

        return new InvoiceResponse(
                savedInvoice.getInvoiceId(),
                savedInvoice.getInvoiceNumber(),
                savedInvoice.getIssuedAt(),
                order.getOrderId(),
                order.getOrderNumber(),
                null,
                null,
                order.getTotalAmount()
        );
    }

    public InvoiceResponse getInvoiceForSale(Long saleId) {

        Invoice invoice = invoiceRepository.findBySale_SaleId(saleId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invoice not found for this sale"
                        )
                );

        InStoreSale sale = invoice.getSale();

        if (sale == null) {
            throw new RuntimeException(
                    "In-store sale not found for this invoice"
            );
        }

        return new InvoiceResponse(
                invoice.getInvoiceId(),
                invoice.getInvoiceNumber(),
                invoice.getIssuedAt(),
                null,
                null,
                sale.getSaleId(),
                sale.getSaleNumber(),
                sale.getTotalAmount()
        );
    }

    public InvoiceResponse getInvoiceForOrder(Long orderId) {

        Invoice invoice = invoiceRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invoice not found for this order"
                        )
                );

        Order order = invoice.getOrder();

        if (order == null) {
            throw new RuntimeException(
                    "Online order not found for this invoice"
            );
        }

        return new InvoiceResponse(
                invoice.getInvoiceId(),
                invoice.getInvoiceNumber(),
                invoice.getIssuedAt(),
                order.getOrderId(),
                order.getOrderNumber(),
                null,
                null,
                order.getTotalAmount()
        );
    }
}