package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class StockInResponse {

    private Long variantId;
    private String productName;
    private String size;
    private String color;
    private Integer previousQuantity;
    private Integer addedQuantity;
    private Integer newQuantity;
    private String movementType;
    private String reason;
    private LocalDateTime createdAt;

    public StockInResponse(
            Long variantId,
            String productName,
            String size,
            String color,
            Integer previousQuantity,
            Integer addedQuantity,
            Integer newQuantity,
            String movementType,
            String reason,
            LocalDateTime createdAt) {

        this.variantId = variantId;
        this.productName = productName;
        this.size = size;
        this.color = color;
        this.previousQuantity = previousQuantity;
        this.addedQuantity = addedQuantity;
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

    public Integer getAddedQuantity() {
        return addedQuantity;
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