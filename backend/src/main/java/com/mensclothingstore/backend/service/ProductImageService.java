package com.mensclothingstore.backend.service;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mensclothingstore.backend.dto.ProductImageResponse;
import com.mensclothingstore.backend.entity.Product;
import com.mensclothingstore.backend.entity.ProductImage;
import com.mensclothingstore.backend.repository.ProductImageRepository;
import com.mensclothingstore.backend.repository.ProductRepository;

@Service
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final ImageStorageService imageStorageService;

    public ProductImageService(
            ProductImageRepository productImageRepository,
            ProductRepository productRepository,
            ImageStorageService imageStorageService) {

        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
        this.imageStorageService = imageStorageService;
    }

    // Get all images for a product
    public List<ProductImageResponse> getImagesByProductId(
            Long productId) {

        List<ProductImage> images =
                productImageRepository
                        .findByProduct_ProductIdOrderByPrimaryDesc(
                                productId
                        );

        return images.stream()
                .map(image -> new ProductImageResponse(
                        image.getImageId(),
                        image.getImageUrl(),
                        image.isPrimary()
                ))
                .toList();
    }

    // Upload an image and associate it with a product
    public ProductImageResponse uploadImage(
            Long productId,
            MultipartFile file,
            boolean primary) throws IOException {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found.")
                );

        String imageUrl = imageStorageService.storeImage(file);

        ProductImage productImage = new ProductImage();
        productImage.setProduct(product);
        productImage.setImageUrl(imageUrl);
        productImage.setPrimary(primary);

        ProductImage savedImage =
                productImageRepository.save(productImage);

        return new ProductImageResponse(
                savedImage.getImageId(),
                savedImage.getImageUrl(),
                savedImage.isPrimary()
        );
    }
}