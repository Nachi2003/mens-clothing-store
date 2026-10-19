package com.mensclothingstore.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "phone_snapshot", nullable = false, length = 20)
    private String phoneSnapshot;

    @Column(name = "address_snapshot", nullable = false, length = 1000)
    private String addressSnapshot;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PLACED";

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod = "COD";

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING";

    @Column(name = "decline_reason", length = 1000)
    private String declineReason;

    @Column(name = "customer_acknowledged_rejection", nullable = false)
    private boolean customerAcknowledgedRejection = false;

    @Column(name = "customer_acknowledged_at")
    private LocalDateTime customerAcknowledgedAt;

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getDeclineReason() {
        return declineReason;
    }

    public void setDeclineReason(String declineReason) {
        this.declineReason = declineReason;
    }

    public boolean isCustomerAcknowledgedRejection() {
        return customerAcknowledgedRejection;
    }

    public void setCustomerAcknowledgedRejection(boolean customerAcknowledgedRejection) {
        this.customerAcknowledgedRejection = customerAcknowledgedRejection;
    }

    public LocalDateTime getCustomerAcknowledgedAt() {
        return customerAcknowledgedAt;
    }

    public void setCustomerAcknowledgedAt(LocalDateTime customerAcknowledgedAt) {
        this.customerAcknowledgedAt = customerAcknowledgedAt;
    }

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;


    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }


    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }


    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }


    public String getPhoneSnapshot() {
        return phoneSnapshot;
    }

    public void setPhoneSnapshot(String phoneSnapshot) {
        this.phoneSnapshot = phoneSnapshot;
    }


    public String getAddressSnapshot() {
        return addressSnapshot;
    }

    public void setAddressSnapshot(String addressSnapshot) {
        this.addressSnapshot = addressSnapshot;
    }


    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}