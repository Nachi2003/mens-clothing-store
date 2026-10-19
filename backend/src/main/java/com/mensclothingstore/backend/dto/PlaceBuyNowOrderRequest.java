
package com.mensclothingstore.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class PlaceBuyNowOrderRequest {

    @NotNull(message = "Product variant is required")
    @Positive(message = "Product variant ID must be positive")
    private Long variantId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    @NotBlank(message = "Address is required")
    @Size(max = 1000, message = "Address must not exceed 1000 characters")
    private String address;

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    private String paymentMethod = "COD";

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
