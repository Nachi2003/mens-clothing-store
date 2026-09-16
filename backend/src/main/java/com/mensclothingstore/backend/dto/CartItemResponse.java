package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;

public class CartItemResponse {

    private Long cartItemId;
    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal subtotal;

    public CartItemResponse(
            Long cartItemId,
            Long variantId,
            String productName,
            String size,
            String color,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal subtotal) {

        this.cartItemId = cartItemId;
        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.subtotal = subtotal;
    }

    public Long getCartItemId() {
        return cartItemId;
    }

    public Long getVariantId() {
        return variantId;
    }

    public String getProductName() {
        return productName;
    }

    public String getSize() {
        return size;
    }

    public String getColor() {
        return color;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }
}