package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;

public class SalesHistoryItemResponse {

    private String productName;
    private String color;
    private String size;

    private Integer quantity;

    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal finalPrice;

    public SalesHistoryItemResponse(
            String productName,
            String color,
            String size,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal discount,
            BigDecimal finalPrice) {

        this.productName = productName;
        this.color = color;
        this.size = size;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.discount = discount;
        this.finalPrice = finalPrice;
    }

    public String getProductName() {
        return productName;
    }

    public String getColor() {
        return color;
    }

    public String getSize() {
        return size;
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
}