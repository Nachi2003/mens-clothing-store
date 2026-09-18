package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SalesHistoryResponse {

    private String transactionType;
    private String transactionNumber;
    private String invoiceNumber;

    private String customerName;
    private String customerPhone;

    private BigDecimal totalAmount;
    private BigDecimal totalDiscount;

    private String paymentMethod;
    private LocalDateTime createdAt;

    public SalesHistoryResponse(
            String transactionType,
            String transactionNumber,
            String invoiceNumber,
            String customerName,
            String customerPhone,
            BigDecimal totalAmount,
            BigDecimal totalDiscount,
            String paymentMethod,
            LocalDateTime createdAt) {

        this.transactionType = transactionType;
        this.transactionNumber = transactionNumber;
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.totalAmount = totalAmount;
        this.totalDiscount = totalDiscount;
        this.paymentMethod = paymentMethod;
        this.createdAt = createdAt;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public String getTransactionNumber() {
        return transactionNumber;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getTotalDiscount() {
        return totalDiscount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}