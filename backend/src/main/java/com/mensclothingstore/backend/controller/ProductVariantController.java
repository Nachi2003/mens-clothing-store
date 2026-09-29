package com.mensclothingstore.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.ProductVariantRequest;
import com.mensclothingstore.backend.dto.ProductVariantResponse;
import com.mensclothingstore.backend.service.ProductVariantService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/product-variants")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    public ProductVariantController(
            ProductVariantService productVariantService) {

        this.productVariantService = productVariantService;
    }

    @GetMapping
    public List<ProductVariantResponse> getAllVariants() {
        return productVariantService.getAllVariants();
    }

    @PostMapping
    public ProductVariantResponse createVariant(
            @Valid @RequestBody ProductVariantRequest request) {

        return productVariantService.createVariant(request);
    }

    @GetMapping("/{variantId}")
    public ProductVariantResponse getVariantById(
            @PathVariable Long variantId) {

        return productVariantService.getVariantById(variantId);
    }

    @PutMapping("/{variantId}")
    public ProductVariantResponse updateVariant(
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantRequest request) {

        return productVariantService.updateVariant(
                variantId, request);
    }

    @DeleteMapping("/{variantId}")
    public void deleteVariant(@PathVariable Long variantId) {
        productVariantService.deleteVariant(variantId);
    }
}