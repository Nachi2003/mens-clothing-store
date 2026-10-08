package com.mensclothingstore.backend.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mensclothingstore.backend.dto.ProductImageResponse;
import com.mensclothingstore.backend.service.ProductImageService;

@RestController
@RequestMapping("/api/products/{productId}/images")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController(
            ProductImageService productImageService) {
        this.productImageService = productImageService;
    }

    // Get images for a product
    @GetMapping
    public List<ProductImageResponse> getImagesByProductId(
            @PathVariable Long productId) {

        return productImageService.getImagesByProductId(productId);
    }

    // Upload an image for a product
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductImageResponse uploadImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean primary)
            throws IOException {

        return productImageService.uploadImage(
                productId,
                file,
                primary
        );
    }
    @DeleteMapping("/{imageId}")
public String deleteImage(
        @PathVariable Long productId,
        @PathVariable Long imageId) throws IOException {

    productImageService.deleteImage(imageId);

    return "Image deleted successfully.";
}
}