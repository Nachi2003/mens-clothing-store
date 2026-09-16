package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class StockMovementResponse {

    private Long movementId;
    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer quantityChange;
    private String movementType;
    private String referenceId;
    private String reason;
    private LocalDateTime createdAt;

    public StockMovementResponse(
            Long movementId,
            Long variantId,
            String productName,
            String size,
            String color,
            Integer quantityChange,
            String movementType,
            String referenceId,
            String reason,
            LocalDateTime createdAt) {

        this.movementId = movementId;
        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.quantityChange = quantityChange;
        this.movementType = movementType;
        this.referenceId = referenceId;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getMovementId() {
        return movementId;
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

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public String getMovementType() {
        return movementType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}