package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class StockAdjustmentResponse {

    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer previousQuantity;
    private Integer quantityChange;
    private Integer newQuantity;
    private String movementType;
    private String reason;
    private LocalDateTime createdAt;

    public StockAdjustmentResponse(
            Long variantId,
            String productName,
            String size,
            String color,
            Integer previousQuantity,
            Integer quantityChange,
            Integer newQuantity,
            String movementType,
            String reason,
            LocalDateTime createdAt) {

        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.previousQuantity = previousQuantity;
        this.quantityChange = quantityChange;
        this.newQuantity = newQuantity;
        this.movementType = movementType;
        this.reason = reason;
        this.createdAt = createdAt;
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

    public Integer getPreviousQuantity() {
        return previousQuantity;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public Integer getNewQuantity() {
        return newQuantity;
    }

    public String getMovementType() {
        return movementType;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}