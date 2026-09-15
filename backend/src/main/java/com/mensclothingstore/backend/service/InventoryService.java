package com.mensclothingstore.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.InventoryRequest;
import com.mensclothingstore.backend.dto.InventoryResponse;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductVariantRepository productVariantRepository) {

        this.inventoryRepository = inventoryRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public List<InventoryResponse> getAllInventory() {

        List<Inventory> inventoryList = inventoryRepository.findAll();

        return inventoryList.stream()
                .map(this::convertToResponse)
                .toList();
    }

    public InventoryResponse getInventoryByVariantId(Long variantId) {

        Optional<Inventory> inventoryOptional =
                inventoryRepository.findByVariant_VariantId(variantId);

        if (inventoryOptional.isEmpty()) {
            throw new RuntimeException("Inventory not found for variant");
        }

        return convertToResponse(inventoryOptional.get());
    }

    public InventoryResponse createInventory(InventoryRequest request) {

        Optional<ProductVariant> variantOptional =
                productVariantRepository.findById(request.getVariantId());

        if (variantOptional.isEmpty()) {
            throw new RuntimeException("Product variant not found");
        }

        Optional<Inventory> existingInventory =
                inventoryRepository.findByVariant_VariantId(request.getVariantId());

        if (existingInventory.isPresent()) {
            throw new RuntimeException("Inventory already exists for this variant");
        }

        Inventory inventory = new Inventory();

        inventory.setVariant(variantOptional.get());
        inventory.setQuantity(request.getQuantity());

        Inventory savedInventory = inventoryRepository.save(inventory);

        return convertToResponse(savedInventory);
    }

    private InventoryResponse convertToResponse(Inventory inventory) {

        ProductVariant variant = inventory.getVariant();

        return new InventoryResponse(
                inventory.getInventoryId(),
                variant.getVariantId(),
                variant.getProduct().getProductName(),
                variant.getSize(),
                variant.getColor(),
                inventory.getQuantity(),
                inventory.getUpdatedAt()
        );
    }
}