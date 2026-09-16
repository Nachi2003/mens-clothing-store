package com.mensclothingstore.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.LowStockResponse;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.entity.ShopSettings;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.ShopSettingsRepository;

@Service
public class LowStockService {

    private final InventoryRepository inventoryRepository;
    private final ShopSettingsRepository shopSettingsRepository;

    public LowStockService(
            InventoryRepository inventoryRepository,
            ShopSettingsRepository shopSettingsRepository) {

        this.inventoryRepository = inventoryRepository;
        this.shopSettingsRepository = shopSettingsRepository;
    }

    public List<LowStockResponse> getLowStockVariants() {

        ShopSettings settings =
                shopSettingsRepository.findAll()
                        .stream()
                        .findFirst()
                        .orElseThrow(() ->
                                new RuntimeException("Shop settings not found"));

        Integer threshold = settings.getLowStockThreshold();

        List<Inventory> inventoryList =
                inventoryRepository.findAll();

        return inventoryList.stream()
                .filter(inventory ->
                        inventory.getQuantity() > 0 &&
                        inventory.getQuantity() <= threshold)
                .map(inventory -> {

                    ProductVariant variant =
                            inventory.getVariant();

                    return new LowStockResponse(
                            variant.getVariantId(),
                            variant.getProduct().getProductName(),
                            variant.getSize(),
                            variant.getColor(),
                            inventory.getQuantity(),
                            threshold
                    );
                })
                .toList();
    }
}