package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderResponse {

    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private String phone;
    private String address;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private String declineReason;
    private boolean customerAcknowledgedRejection;
    private LocalDateTime customerAcknowledgedAt;

    public OrderResponse(
            Long orderId,
            String orderNumber,
            Long customerId,
            String phone,
            String address,
            BigDecimal totalAmount,
            String status,
            LocalDateTime createdAt) {
        this(orderId, orderNumber, customerId, phone, address, totalAmount,
                status, createdAt, null, false, null);
    }

    public OrderResponse(
            Long orderId,
            String orderNumber,
            Long customerId,
            String phone,
            String address,
            BigDecimal totalAmount,
            String status,
            LocalDateTime createdAt,
            String declineReason,
            boolean customerAcknowledgedRejection,
            LocalDateTime customerAcknowledgedAt) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customerId = customerId;
        this.phone = phone;
        this.address = address;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
        this.declineReason = declineReason;
        this.customerAcknowledgedRejection = customerAcknowledgedRejection;
        this.customerAcknowledgedAt = customerAcknowledgedAt;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getDeclineReason() {
        return declineReason;
    }

    public boolean isCustomerAcknowledgedRejection() {
        return customerAcknowledgedRejection;
    }

    public LocalDateTime getCustomerAcknowledgedAt() {
        return customerAcknowledgedAt;
    }
}