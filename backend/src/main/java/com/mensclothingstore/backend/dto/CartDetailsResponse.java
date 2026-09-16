package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class CartDetailsResponse {

    private Long cartId;
    private Long customerId;
    private List<CartItemResponse> items;
    private BigDecimal totalAmount;

    public CartDetailsResponse(
            Long cartId,
            Long customerId,
            List<CartItemResponse> items,
            BigDecimal totalAmount) {

        this.cartId = cartId;
        this.customerId = customerId;
        this.items = items;
        this.totalAmount = totalAmount;
    }

    public Long getCartId() {
        return cartId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
}