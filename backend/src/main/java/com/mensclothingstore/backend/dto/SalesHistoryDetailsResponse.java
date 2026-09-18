package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SalesHistoryDetailsResponse {

    private String transactionType;
    private String transactionNumber;

    private String customerName;
    private String customerPhone;

    private String address;

    private BigDecimal totalAmount;
    private BigDecimal totalDiscount;

    private String paymentMethod;
    private LocalDateTime createdAt;

    private String invoiceNumber;

    private List<SalesHistoryItemResponse> items;

    public SalesHistoryDetailsResponse(
            String transactionType,
            String transactionNumber,
            String customerName,
            String customerPhone,
            String address,
            BigDecimal totalAmount,
            BigDecimal totalDiscount,
            String paymentMethod,
            LocalDateTime createdAt,
            String invoiceNumber,
            List<SalesHistoryItemResponse> items) {

        this.transactionType = transactionType;
        this.transactionNumber = transactionNumber;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.address = address;
        this.totalAmount = totalAmount;
        this.totalDiscount = totalDiscount;
        this.paymentMethod = paymentMethod;
        this.createdAt = createdAt;
        this.invoiceNumber = invoiceNumber;
        this.items = items;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public String getTransactionNumber() {
        return transactionNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getAddress() {
        return address;
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

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public List<SalesHistoryItemResponse> getItems() {
        return items;
    }
}