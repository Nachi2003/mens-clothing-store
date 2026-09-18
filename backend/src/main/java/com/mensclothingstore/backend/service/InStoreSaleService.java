package com.mensclothingstore.backend.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.dto.InStoreSaleItemRequest;
import com.mensclothingstore.backend.dto.InStoreSaleRequest;
import com.mensclothingstore.backend.dto.InvoiceResponse;
import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.InStoreSaleItem;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.entity.StockMovement;
import com.mensclothingstore.backend.repository.InStoreSaleItemRepository;
import com.mensclothingstore.backend.repository.InStoreSaleRepository;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;
import com.mensclothingstore.backend.repository.StockMovementRepository;

@Service
public class InStoreSaleService {

    private final InStoreSaleRepository inStoreSaleRepository;
    private final InStoreSaleItemRepository inStoreSaleItemRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InvoiceService invoiceService;

    public InStoreSaleService(
            InStoreSaleRepository inStoreSaleRepository,
            InStoreSaleItemRepository inStoreSaleItemRepository,
            InventoryRepository inventoryRepository,
            StockMovementRepository stockMovementRepository,
            ProductVariantRepository productVariantRepository,
            InvoiceService invoiceService) {

        this.inStoreSaleRepository = inStoreSaleRepository;
        this.inStoreSaleItemRepository = inStoreSaleItemRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.productVariantRepository = productVariantRepository;
        this.invoiceService = invoiceService;
    }

    private String generateSaleNumber() {

        long nextNumber = inStoreSaleRepository.count() + 1;

        return String.format("SAL-%06d", nextNumber);
    }

    @Transactional
    public InStoreSale createSale(InStoreSaleRequest request) {

        InStoreSale sale = new InStoreSale();

        sale.setSaleNumber(generateSaleNumber());
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setPaymentMethod(request.getPaymentMethod());

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        // Save the sale first so that sale items can reference it
        sale.setTotalAmount(BigDecimal.ZERO);
        sale.setTotalDiscount(BigDecimal.ZERO);

        InStoreSale savedSale = inStoreSaleRepository.save(sale);

        for (InStoreSaleItemRequest itemRequest : request.getItems()) {

            ProductVariant variant = productVariantRepository
                    .findById(itemRequest.getVariantId())
                    .orElseThrow(() ->
                            new RuntimeException("Product variant not found")
                    );

            Inventory inventory = inventoryRepository
                    .findByVariantIdForUpdate(itemRequest.getVariantId())
                    .orElseThrow(() ->
                            new RuntimeException("Inventory not found")
                    );

            int requestedQuantity = itemRequest.getQuantity();

            // Check stock
            if (inventory.getQuantity() < requestedQuantity) {
                throw new RuntimeException(
                        "Insufficient stock for variant "
                                + itemRequest.getVariantId()
                );
            }

            BigDecimal unitPrice = variant.getPrice();

            BigDecimal discount = itemRequest.getDiscount();

            if (discount == null) {
                discount = BigDecimal.ZERO;
            }

            // Discount cannot be negative
            if (discount.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Discount cannot be negative");
            }

            // Discount cannot be greater than the unit price
            if (discount.compareTo(unitPrice) > 0) {
                throw new RuntimeException(
                        "Discount cannot be greater than unit price"
                );
            }

            BigDecimal finalPrice = unitPrice.subtract(discount);

            BigDecimal subtotal =
                    finalPrice.multiply(BigDecimal.valueOf(requestedQuantity));

            // Reduce inventory
            inventory.setQuantity(
                    inventory.getQuantity() - requestedQuantity
            );

            inventoryRepository.save(inventory);

            // Record stock movement
            StockMovement movement = new StockMovement();

            movement.setVariant(variant);
            movement.setQuantityChange(-requestedQuantity);
            movement.setMovementType("IN_STORE_SALE");
            movement.setReferenceId(savedSale.getSaleNumber());
            movement.setReason("In-store sale");

            stockMovementRepository.save(movement);

            // Create sale item
            InStoreSaleItem saleItem = new InStoreSaleItem();

            saleItem.setSale(savedSale);
            saleItem.setVariant(variant);
            saleItem.setQuantity(requestedQuantity);
            saleItem.setUnitPrice(unitPrice);
            saleItem.setDiscount(discount);
            saleItem.setFinalPrice(finalPrice);

            inStoreSaleItemRepository.save(saleItem);

            totalAmount = totalAmount.add(subtotal);

            BigDecimal itemDiscount =
                    discount.multiply(BigDecimal.valueOf(requestedQuantity));

            totalDiscount = totalDiscount.add(itemDiscount);
        }

        // Update final sale totals
        savedSale.setTotalAmount(totalAmount);
        savedSale.setTotalDiscount(totalDiscount);

        InStoreSale finalSale = inStoreSaleRepository.save(savedSale);

        // Automatically create invoice
        InvoiceResponse invoice =
                invoiceService.createInvoiceForSale(finalSale.getSaleId());

        return finalSale;
    }
}