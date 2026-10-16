package com.mensclothingstore.backend.service;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.dto.ProductRequest;
import com.mensclothingstore.backend.dto.ProductResponse;
import com.mensclothingstore.backend.entity.Category;
import com.mensclothingstore.backend.entity.Product;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.repository.CartItemRepository;
import com.mensclothingstore.backend.repository.CategoryRepository;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.OrderItemRepository;
import com.mensclothingstore.backend.repository.ProductImageRepository;
import com.mensclothingstore.backend.repository.ProductRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;
import com.mensclothingstore.backend.repository.StockMovementRepository;

@Service
public class ProductService {
private final CartItemRepository cartItemRepository;
private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
private final OrderItemRepository orderItemRepository;
private final StockMovementRepository stockMovementRepository;
private final ProductImageRepository productImageRepository;

    
public ProductService(
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        ProductVariantRepository productVariantRepository,
        OrderItemRepository orderItemRepository,
        StockMovementRepository stockMovementRepository,
        ProductImageRepository productImageRepository,
        CartItemRepository cartItemRepository,
        InventoryRepository inventoryRepository) {

    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.productVariantRepository = productVariantRepository;
    this.orderItemRepository = orderItemRepository;
    this.stockMovementRepository = stockMovementRepository;
    this.productImageRepository = productImageRepository;
    this.cartItemRepository = cartItemRepository;
    this.inventoryRepository = inventoryRepository;
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

 
@Transactional
public void deleteProduct(Long productId) {
    Product product = productRepository.findById(productId)
            .orElseThrow(() ->
                    new RuntimeException("Product not found"));

    List<ProductVariant> variants =
            productVariantRepository.findByProduct_ProductId(productId);

    // Check every variant before deleting anything.
    for (ProductVariant variant : variants) {
        Long variantId = variant.getVariantId();

        if (orderItemRepository.existsByVariant_VariantId(variantId)) {
            throw new IllegalStateException(
                    "Cannot delete this product because it has order history.");
        }

        if (stockMovementRepository.existsByVariant_VariantId(variantId)) {
            throw new IllegalStateException(
                    "Cannot delete this product because it has stock movement history.");
        }
    }

    // Delete dependent records in the correct order.
    productImageRepository.deleteByProduct_ProductId(productId);

    for (ProductVariant variant : variants) {
        Long variantId = variant.getVariantId();

        cartItemRepository.deleteByVariant_VariantId(variantId);
        inventoryRepository.deleteByVariant_VariantId(variantId);
    }

    productVariantRepository.deleteAll(variants);
    productRepository.delete(product);
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