package com.mensclothingstore.backend.dto;

public class ProductResponse {

    private Long productId;
    private Long categoryId;
    private String categoryName;
    private String productName;
    private String description;

    public ProductResponse(
            Long productId,
            Long categoryId,
            String categoryName,
            String productName,
            String description) {

        this.productId = productId;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.productName = productName;
        this.description = description;
    }

    public Long getProductId() {
        return productId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getProductName() {
        return productName;
    }

    public String getDescription() {
        return description;
    }
}