package com.mensclothingstore.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.OutOfStockResponse;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.repository.InventoryRepository;

@Service
public class OutOfStockService {

    private final InventoryRepository inventoryRepository;

    public OutOfStockService(
            InventoryRepository inventoryRepository) {

        this.inventoryRepository = inventoryRepository;
    }

    public List<OutOfStockResponse> getOutOfStockVariants() {

        List<Inventory> inventoryList =
                inventoryRepository.findAll();

        return inventoryList.stream()
                .filter(inventory ->
                        inventory.getQuantity() == 0)
                .map(inventory -> {

                    ProductVariant variant =
                            inventory.getVariant();

                    return new OutOfStockResponse(
                            variant.getVariantId(),
                            variant.getProduct().getProductName(),
                            variant.getSize(),
                            variant.getColor(),
                            inventory.getQuantity()
                    );
                })
                .toList();
    }
}