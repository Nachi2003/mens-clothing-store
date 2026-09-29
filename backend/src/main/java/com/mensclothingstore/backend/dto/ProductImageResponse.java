package com.mensclothingstore.backend.dto;

public class ProductImageResponse {

    private Long imageId;
    private String imageUrl;
    private boolean primary;

    public ProductImageResponse(
            Long imageId,
            String imageUrl,
            boolean primary) {

        this.imageId = imageId;
        this.imageUrl = imageUrl;
        this.primary = primary;
    }

    public Long getImageId() {
        return imageId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isPrimary() {
        return primary;
    }
}