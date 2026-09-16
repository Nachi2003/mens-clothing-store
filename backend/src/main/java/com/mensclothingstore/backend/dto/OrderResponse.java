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

    public OrderResponse(
            Long orderId,
            String orderNumber,
            Long customerId,
            String phone,
            String address,
            BigDecimal totalAmount,
            String status,
            LocalDateTime createdAt) {

        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customerId = customerId;
        this.phone = phone;
        this.address = address;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
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
}