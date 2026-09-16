package com.mensclothingstore.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.CustomerAddressRequest;
import com.mensclothingstore.backend.dto.CustomerAddressResponse;
import com.mensclothingstore.backend.service.CustomerAddressService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
public class CustomerAddressController {

    private final CustomerAddressService customerAddressService;

    public CustomerAddressController(
            CustomerAddressService customerAddressService) {

        this.customerAddressService = customerAddressService;
    }

    @PostMapping("/{userId}/address")
    public CustomerAddressResponse createAddress(
            @PathVariable Long userId,
            @Valid @RequestBody CustomerAddressRequest request) {

        return customerAddressService.createAddress(userId, request);
    }

    @GetMapping("/{userId}/address")
    public CustomerAddressResponse getAddress(
            @PathVariable Long userId) {

        return customerAddressService.getAddress(userId);
    }

    @PutMapping("/{userId}/address")
    public CustomerAddressResponse updateAddress(
            @PathVariable Long userId,
            @Valid @RequestBody CustomerAddressRequest request) {

        return customerAddressService.updateAddress(userId, request);
    }
}