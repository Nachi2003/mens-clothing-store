package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;

public class ProductVariantResponse {

    private Long variantId;
    private Long productId;
    private String productName;
    private String size;
    private String color;
    private BigDecimal price;
    private Boolean active;

    public ProductVariantResponse(
            Long variantId,
            Long productId,
            String productName,
            String size,
            String color,
            BigDecimal price,
            Boolean active) {

        this.variantId = variantId;
        this.productId = productId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.price = price;
        this.active = active;
    }

    public Long getVariantId() {
        return variantId;
    }

    public Long getProductId() {
        return productId;
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

    public BigDecimal getPrice() {
        return price;
    }

    public Boolean getActive() {
        return active;
    }
}