package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class CartResponse {

    private Long cartId;
    private Long customerId;
    private LocalDateTime createdAt;

    public CartResponse(
            Long cartId,
            Long customerId,
            LocalDateTime createdAt) {

        this.cartId = cartId;
        this.customerId = customerId;
        this.createdAt = createdAt;
    }

    public Long getCartId() {
        return cartId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}