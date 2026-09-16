package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;

public class OrderItemResponse {

    private Long orderItemId;
    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal finalPrice;
    private BigDecimal subtotal;

    public OrderItemResponse(
            Long orderItemId,
            Long variantId,
            String productName,
            String size,
            String color,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal discount,
            BigDecimal finalPrice,
            BigDecimal subtotal) {

        this.orderItemId = orderItemId;
        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.discount = discount;
        this.finalPrice = finalPrice;
        this.subtotal = subtotal;
    }

    public Long getOrderItemId() {
        return orderItemId;
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

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }
}