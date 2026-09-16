package com.mensclothingstore.backend.dto;

public class LowStockResponse {

    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;
    private Integer lowStockThreshold;

    public LowStockResponse(
            Long variantId,
            String productName,
            String size,
            String color,
            Integer quantity,
            Integer lowStockThreshold) {

        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.quantity = quantity;
        this.lowStockThreshold = lowStockThreshold;
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

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }
}