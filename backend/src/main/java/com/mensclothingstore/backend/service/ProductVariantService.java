package com.mensclothingstore.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.ProductVariantRequest;
import com.mensclothingstore.backend.dto.ProductVariantResponse;
import com.mensclothingstore.backend.entity.Product;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.repository.ProductRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;

@Service
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;

    public ProductVariantService(
            ProductVariantRepository productVariantRepository,
            ProductRepository productRepository) {

        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
    }

    public List<ProductVariantResponse> getAllVariants() {

        List<ProductVariant> variants =
                productVariantRepository.findAll();

        return variants.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public ProductVariantResponse createVariant(
            ProductVariantRequest request) {

        Optional<Product> productOptional =
                productRepository.findById(request.getProductId());

        if (productOptional.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        ProductVariant variant = new ProductVariant();

        variant.setProduct(productOptional.get());
        variant.setSize(request.getSize());
        variant.setColor(request.getColor());
        variant.setPrice(request.getPrice());
        variant.setActive(true);

        ProductVariant savedVariant =
                productVariantRepository.save(variant);

        return convertToResponse(savedVariant);
    }

    public ProductVariantResponse getVariantById(Long variantId) {

        Optional<ProductVariant> variantOptional =
                productVariantRepository.findById(variantId);

        if (variantOptional.isEmpty()) {
            throw new RuntimeException("Product variant not found");
        }

        return convertToResponse(variantOptional.get());
    }

    public ProductVariantResponse updateVariant(
            Long variantId,
            ProductVariantRequest request) {

        Optional<ProductVariant> variantOptional =
                productVariantRepository.findById(variantId);

        if (variantOptional.isEmpty()) {
            throw new RuntimeException("Product variant not found");
        }

        Optional<Product> productOptional =
                productRepository.findById(request.getProductId());

        if (productOptional.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        ProductVariant variant = variantOptional.get();

        variant.setProduct(productOptional.get());
        variant.setSize(request.getSize());
        variant.setColor(request.getColor());
        variant.setPrice(request.getPrice());

        ProductVariant updatedVariant =
                productVariantRepository.save(variant);

        return convertToResponse(updatedVariant);
    }

    public void deleteVariant(Long variantId) {

        Optional<ProductVariant> variantOptional =
                productVariantRepository.findById(variantId);

        if (variantOptional.isEmpty()) {
            throw new RuntimeException("Product variant not found");
        }

        productVariantRepository.delete(variantOptional.get());
    }

    private ProductVariantResponse convertToResponse(
            ProductVariant variant) {

        return new ProductVariantResponse(
                variant.getVariantId(),
                variant.getProduct().getProductId(),
                variant.getProduct().getProductName(),
                variant.getSize(),
                variant.getColor(),
                variant.getPrice(),
                variant.getActive()
        );
    }
}