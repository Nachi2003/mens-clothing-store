package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDetailsResponse {

    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private String phone;
    private String address;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
    private String declineReason;
    private boolean customerAcknowledgedRejection;
    private LocalDateTime customerAcknowledgedAt;

    public OrderDetailsResponse(
            Long orderId,
            String orderNumber,
            Long customerId,
            String phone,
            String address,
            BigDecimal totalAmount,
            String status,
            LocalDateTime createdAt,
            List<OrderItemResponse> items) {
        this(orderId, orderNumber, customerId, phone, address, totalAmount,
                status, createdAt, items, null, false, null);
    }

    public OrderDetailsResponse(
            Long orderId,
            String orderNumber,
            Long customerId,
            String phone,
            String address,
            BigDecimal totalAmount,
            String status,
            LocalDateTime createdAt,
            List<OrderItemResponse> items,
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
        this.items = items;
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

    public List<OrderItemResponse> getItems() {
        return items;
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