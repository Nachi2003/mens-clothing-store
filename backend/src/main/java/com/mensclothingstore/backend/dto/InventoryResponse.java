package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class InventoryResponse {

    private Long inventoryId;
    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer quantity;
    private LocalDateTime updatedAt;

    public InventoryResponse(
            Long inventoryId,
            Long variantId,
            String productName,
            String size,
            String color,
            Integer quantity,
            LocalDateTime updatedAt) {

        this.inventoryId = inventoryId;
        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.quantity = quantity;
        this.updatedAt = updatedAt;
    }

    public Long getInventoryId() {
        return inventoryId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}