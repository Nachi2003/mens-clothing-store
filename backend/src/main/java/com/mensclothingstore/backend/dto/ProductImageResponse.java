
package com.mensclothingstore.backend.dto;

public class ProductImageResponse {

    private Long imageId;
    private String imageUrl;
    private boolean primary;
    private String color;

    public ProductImageResponse(
            Long imageId,
            String imageUrl,
            boolean primary,
            String color) {

        this.imageId = imageId;
        this.imageUrl = imageUrl;
        this.primary = primary;
        this.color = color;
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

    public String getColor() {
        return color;
    }
}
