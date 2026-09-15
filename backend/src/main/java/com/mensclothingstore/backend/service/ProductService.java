package com.mensclothingstore.backend.service;

import com.mensclothingstore.backend.dto.ProductRequest;
import com.mensclothingstore.backend.dto.ProductResponse;
import com.mensclothingstore.backend.entity.Category;
import com.mensclothingstore.backend.entity.Product;
import com.mensclothingstore.backend.repository.CategoryRepository;
import com.mensclothingstore.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<ProductResponse> getAllProducts() {

        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public ProductResponse createProduct(ProductRequest request) {

        Optional<Category> categoryOptional =
                categoryRepository.findById(request.getCategoryId());

        if (categoryOptional.isEmpty()) {
            throw new RuntimeException("Category not found");
        }

        Product product = new Product();

        product.setCategory(categoryOptional.get());
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());

        Product savedProduct = productRepository.save(product);

        return convertToResponse(savedProduct);
    }

    public ProductResponse getProductById(Long productId) {

        Optional<Product> productOptional =
                productRepository.findById(productId);

        if (productOptional.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        return convertToResponse(productOptional.get());
    }

    public ProductResponse updateProduct(
            Long productId,
            ProductRequest request) {

        Optional<Product> productOptional =
                productRepository.findById(productId);

        if (productOptional.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        Optional<Category> categoryOptional =
                categoryRepository.findById(request.getCategoryId());

        if (categoryOptional.isEmpty()) {
            throw new RuntimeException("Category not found");
        }

        Product product = productOptional.get();

        product.setCategory(categoryOptional.get());
        product.setProductName(request.getProductName());
        product.setDescription(request.getDescription());

        Product updatedProduct = productRepository.save(product);

        return convertToResponse(updatedProduct);
    }

    public void deleteProduct(Long productId) {

        Optional<Product> productOptional =
                productRepository.findById(productId);

        if (productOptional.isEmpty()) {
            throw new RuntimeException("Product not found");
        }

        productRepository.delete(productOptional.get());
    }

    private ProductResponse convertToResponse(Product product) {

        return new ProductResponse(
                product.getProductId(),
                product.getCategory().getCategoryId(),
                product.getCategory().getCategoryName(),
                product.getProductName(),
                product.getDescription()
        );
    }
}