package com.mensclothingstore.backend.dto;

import java.time.LocalDateTime;

public class CustomerAddressResponse {

    private Long addressId;
    private Long userId;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private Boolean isDefault;
    private LocalDateTime createdAt;

    public CustomerAddressResponse(
            Long addressId,
            Long userId,
            String address,
            String city,
            String state,
            String pincode,
            Boolean isDefault,
            LocalDateTime createdAt) {

        this.addressId = addressId;
        this.userId = userId;
        this.address = address;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
        this.isDefault = isDefault;
        this.createdAt = createdAt;
    }

    public Long getAddressId() {
        return addressId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getPincode() {
        return pincode;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}