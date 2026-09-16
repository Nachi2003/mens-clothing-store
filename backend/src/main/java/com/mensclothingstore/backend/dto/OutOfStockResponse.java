package com.mensclothingstore.backend.dto;

public class OutOfStockResponse {

    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;

    public OutOfStockResponse(
            Long variantId,
            String productName,
            String size,
            String color,
            Integer quantity) {

        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.quantity = quantity;
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
}