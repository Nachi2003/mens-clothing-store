package com.mensclothingstore.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.dto.StockAdjustmentRequest;
import com.mensclothingstore.backend.dto.StockAdjustmentResponse;
import com.mensclothingstore.backend.dto.StockInRequest;
import com.mensclothingstore.backend.dto.StockInResponse;
import com.mensclothingstore.backend.dto.StockMovementResponse;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.entity.StockMovement;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;
import com.mensclothingstore.backend.repository.StockMovementRepository;

@Service
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;

    public StockMovementService(
            StockMovementRepository stockMovementRepository,
            InventoryRepository inventoryRepository,
            ProductVariantRepository productVariantRepository) {

        this.stockMovementRepository = stockMovementRepository;
        this.inventoryRepository = inventoryRepository;
        this.productVariantRepository = productVariantRepository;
    }

    public List<StockMovementResponse> getAllMovements() {

        List<StockMovement> movements =
                stockMovementRepository.findAll();

        return movements.stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional
    public StockInResponse stockIn(StockInRequest request) {

        ProductVariant variant =
                productVariantRepository.findById(request.getVariantId())
                        .orElseThrow(() ->
                                new RuntimeException("Product variant not found"));

        Inventory inventory =
                inventoryRepository.findByVariant_VariantId(request.getVariantId())
                        .orElseThrow(() ->
                                new RuntimeException("Inventory not found for variant"));

        Integer previousQuantity = inventory.getQuantity();

        Integer newQuantity =
                previousQuantity + request.getQuantity();

        inventory.setQuantity(newQuantity);

        inventoryRepository.save(inventory);

        StockMovement movement = new StockMovement();

        movement.setVariant(variant);
        movement.setQuantityChange(request.getQuantity());
        movement.setMovementType("STOCK_IN");
        movement.setReferenceId(null);
        movement.setReason(request.getReason());

        StockMovement savedMovement =
                stockMovementRepository.save(movement);

        return new StockInResponse(
                variant.getVariantId(),
                variant.getProduct().getProductName(),
                variant.getSize(),
                variant.getColor(),
                previousQuantity,
                request.getQuantity(),
                newQuantity,
                "STOCK_IN",
                request.getReason(),
                savedMovement.getCreatedAt()
        );
    }

    private StockMovementResponse convertToResponse(
            StockMovement movement) {

        ProductVariant variant = movement.getVariant();

        return new StockMovementResponse(
                movement.getMovementId(),
                variant.getVariantId(),
                variant.getProduct().getProductName(),
                variant.getSize(),
                variant.getColor(),
                movement.getQuantityChange(),
                movement.getMovementType(),
                movement.getReferenceId(),
                movement.getReason(),
                movement.getCreatedAt()
        );
    }
    @Transactional
public StockAdjustmentResponse adjustStock(
        StockAdjustmentRequest request) {

    ProductVariant variant =
            productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() ->
                            new RuntimeException("Product variant not found"));

    Inventory inventory =
            inventoryRepository.findByVariant_VariantId(request.getVariantId())
                    .orElseThrow(() ->
                            new RuntimeException("Inventory not found for variant"));

    Integer previousQuantity = inventory.getQuantity();

    Integer newQuantity =
            previousQuantity + request.getQuantityChange();

    if (newQuantity < 0) {
        throw new RuntimeException(
                "Stock adjustment cannot make inventory negative");
    }

    inventory.setQuantity(newQuantity);
    inventoryRepository.save(inventory);

    StockMovement movement = new StockMovement();

    movement.setVariant(variant);
    movement.setQuantityChange(request.getQuantityChange());
    movement.setMovementType("STOCK_ADJUSTMENT");
    movement.setReferenceId(null);
    movement.setReason(request.getReason());

    StockMovement savedMovement =
            stockMovementRepository.save(movement);

    return new StockAdjustmentResponse(
            variant.getVariantId(),
            variant.getProduct().getProductName(),
            variant.getSize(),
            variant.getColor(),
            previousQuantity,
            request.getQuantityChange(),
            newQuantity,
            "STOCK_ADJUSTMENT",
            request.getReason(),
            savedMovement.getCreatedAt()
    );
}
}