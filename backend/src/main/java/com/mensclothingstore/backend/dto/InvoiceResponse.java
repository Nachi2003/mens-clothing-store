package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceResponse {

    private Long invoiceId;
    private String invoiceNumber;
    private LocalDateTime issuedAt;

    private Long orderId;
    private String orderNumber;

    private Long saleId;
    private String saleNumber;

    private BigDecimal totalAmount;

    public InvoiceResponse(
            Long invoiceId,
            String invoiceNumber,
            LocalDateTime issuedAt,
            Long orderId,
            String orderNumber,
            Long saleId,
            String saleNumber,
            BigDecimal totalAmount) {

        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.issuedAt = issuedAt;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.saleId = saleId;
        this.saleNumber = saleNumber;
        this.totalAmount = totalAmount;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public LocalDateTime getIssuedAt() {
        return issuedAt;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public Long getSaleId() {
        return saleId;
    }

    public String getSaleNumber() {
        return saleNumber;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
}