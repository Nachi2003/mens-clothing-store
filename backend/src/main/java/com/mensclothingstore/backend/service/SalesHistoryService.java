package com.mensclothingstore.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.SalesHistoryDetailsResponse;
import com.mensclothingstore.backend.dto.SalesHistoryItemResponse;
import com.mensclothingstore.backend.dto.SalesHistoryResponse;
import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.InStoreSaleItem;
import com.mensclothingstore.backend.entity.Invoice;
import com.mensclothingstore.backend.entity.Order;
import com.mensclothingstore.backend.entity.OrderItem;
import com.mensclothingstore.backend.repository.InStoreSaleItemRepository;
import com.mensclothingstore.backend.repository.InvoiceRepository;
import com.mensclothingstore.backend.repository.OrderItemRepository;
import com.mensclothingstore.backend.repository.SalesHistoryRepository;

@Service
public class SalesHistoryService {

    private final SalesHistoryRepository salesHistoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final InStoreSaleItemRepository inStoreSaleItemRepository;
    private final InvoiceRepository invoiceRepository;

    public SalesHistoryService(
            SalesHistoryRepository salesHistoryRepository,
            OrderItemRepository orderItemRepository,
            InStoreSaleItemRepository inStoreSaleItemRepository,
            InvoiceRepository invoiceRepository) {

        this.salesHistoryRepository = salesHistoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.inStoreSaleItemRepository = inStoreSaleItemRepository;
        this.invoiceRepository = invoiceRepository;
    }

    // =========================================================
    // SALES HISTORY
    // =========================================================

    public List<SalesHistoryResponse> getSalesHistory(
            LocalDateTime start,
            LocalDateTime end,
            String transactionNumber,
            String invoiceNumber,
            String customerName,
            String customerPhone,
            String transactionType) {

        List<InStoreSale> inStoreSales =
                salesHistoryRepository.findInStoreSalesBetween(start, end);

        List<Order> onlineOrders =
                salesHistoryRepository.findOnlineSalesBetween(start, end);

        // =====================================================
        // FILTER BY TRANSACTION NUMBER
        // =====================================================

        if (transactionNumber != null && !transactionNumber.isBlank()) {

            String searchNumber = transactionNumber.trim();

            inStoreSales = inStoreSales.stream()
                    .filter(sale ->
                            sale.getSaleNumber()
                                    .equalsIgnoreCase(searchNumber))
                    .toList();

            onlineOrders = onlineOrders.stream()
                    .filter(order ->
                            order.getOrderNumber()
                                    .equalsIgnoreCase(searchNumber))
                    .toList();
        }

        // =====================================================
        // FILTER BY INVOICE NUMBER
        // =====================================================

        if (invoiceNumber != null && !invoiceNumber.isBlank()) {

            String searchInvoice = invoiceNumber.trim();

            List<InStoreSale> filteredInStoreSales =
                    new ArrayList<>();

            for (InStoreSale sale : inStoreSales) {

                boolean matches =
                        invoiceRepository
                                .findBySale_SaleId(sale.getSaleId())
                                .map(Invoice::getInvoiceNumber)
                                .map(number ->
                                        number.equalsIgnoreCase(searchInvoice))
                                .orElse(false);

                if (matches) {
                    filteredInStoreSales.add(sale);
                }
            }

            inStoreSales = filteredInStoreSales;

            List<Order> filteredOnlineOrders =
                    new ArrayList<>();

            for (Order order : onlineOrders) {

                boolean matches =
                        invoiceRepository
                                .findByOrder_OrderId(order.getOrderId())
                                .map(Invoice::getInvoiceNumber)
                                .map(number ->
                                        number.equalsIgnoreCase(searchInvoice))
                                .orElse(false);

                if (matches) {
                    filteredOnlineOrders.add(order);
                }
            }

            onlineOrders = filteredOnlineOrders;
        }

        // =====================================================
        // FILTER BY CUSTOMER NAME
        // =====================================================

        if (customerName != null && !customerName.isBlank()) {

            String searchName =
                    customerName.trim().toLowerCase();

            inStoreSales = inStoreSales.stream()
                    .filter(sale ->
                            sale.getCustomerName() != null &&
                            sale.getCustomerName()
                                    .toLowerCase()
                                    .contains(searchName))
                    .toList();

            onlineOrders = onlineOrders.stream()
                    .filter(order ->
                            order.getCustomer() != null &&
                            order.getCustomer().getName() != null &&
                            order.getCustomer().getName()
                                    .toLowerCase()
                                    .contains(searchName))
                    .toList();
        }

        // =====================================================
        // FILTER BY CUSTOMER PHONE
        // =====================================================

        if (customerPhone != null && !customerPhone.isBlank()) {

            String searchPhone =
                    customerPhone.trim();

            inStoreSales = inStoreSales.stream()
                    .filter(sale ->
                            sale.getCustomerPhone() != null &&
                            sale.getCustomerPhone()
                                    .contains(searchPhone))
                    .toList();

            onlineOrders = onlineOrders.stream()
                    .filter(order ->
                            order.getPhoneSnapshot() != null &&
                            order.getPhoneSnapshot()
                                    .contains(searchPhone))
                    .toList();
        }

        // =====================================================
        // FILTER BY TRANSACTION TYPE
        // =====================================================

        if (transactionType != null && !transactionType.isBlank()) {

            String type =
                    transactionType.trim().toUpperCase();

            if (type.equals("IN_STORE")) {

                onlineOrders = new ArrayList<>();

            } else if (type.equals("ONLINE")) {

                inStoreSales = new ArrayList<>();

            } else {

                throw new IllegalArgumentException(
                        "Invalid transaction type. Use ONLINE or IN_STORE"
                );
            }
        }

        List<SalesHistoryResponse> response =
                new ArrayList<>();

        // =====================================================
        // ADD IN-STORE SALES
        // =====================================================

        for (InStoreSale sale : inStoreSales) {

            String saleInvoiceNumber =
                    invoiceRepository
                            .findBySale_SaleId(sale.getSaleId())
                            .map(Invoice::getInvoiceNumber)
                            .orElse(null);

            response.add(
                    new SalesHistoryResponse(
                            "IN_STORE",
                            sale.getSaleNumber(),
                            saleInvoiceNumber,
                            sale.getCustomerName(),
                            sale.getCustomerPhone(),
                            sale.getTotalAmount(),
                            sale.getTotalDiscount(),
                            sale.getPaymentMethod(),
                            sale.getCreatedAt()
                    )
            );
        }

        // =====================================================
        // ADD ONLINE SALES
        // =====================================================

        for (Order order : onlineOrders) {

            BigDecimal onlineDiscount =
                    orderItemRepository.getTotalDiscountByOrderId(
                            order.getOrderId()
                    );

            if (onlineDiscount == null) {
                onlineDiscount = BigDecimal.ZERO;
            }

            String orderInvoiceNumber =
                    invoiceRepository
                            .findByOrder_OrderId(order.getOrderId())
                            .map(Invoice::getInvoiceNumber)
                            .orElse(null);

            response.add(
                    new SalesHistoryResponse(
                            "ONLINE",
                            order.getOrderNumber(),
                            orderInvoiceNumber,
                            order.getCustomer().getName(),
                            order.getPhoneSnapshot(),
                            order.getTotalAmount(),
                            onlineDiscount,
                            "ONLINE",
                            order.getCreatedAt()
                    )
            );
        }

        // =====================================================
        // SORT NEWEST FIRST
        // =====================================================

        response.sort(
                Comparator.comparing(
                        SalesHistoryResponse::getCreatedAt
                ).reversed()
        );

        return response;
    }

    // =========================================================
    // IN-STORE TRANSACTION DETAILS
    // =========================================================

    public SalesHistoryDetailsResponse getInStoreSaleDetails(
            Long saleId) {

        InStoreSale sale =
                salesHistoryRepository.findById(saleId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "In-store sale not found"
                                )
                        );

        List<InStoreSaleItem> saleItems =
                inStoreSaleItemRepository
                        .findBySale_SaleId(saleId);

        List<SalesHistoryItemResponse> items =
                new ArrayList<>();

        // =====================================================
        // ADD SALE ITEMS
        // =====================================================

        for (InStoreSaleItem item : saleItems) {

            items.add(
                    new SalesHistoryItemResponse(
                            item.getVariant()
                                    .getProduct()
                                    .getProductName(),
                            item.getVariant().getColor(),
                            item.getVariant().getSize(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getDiscount(),
                            item.getFinalPrice()
                    )
            );
        }

        // =====================================================
        // GET INVOICE NUMBER
        // =====================================================

        String invoiceNumber =
                invoiceRepository
                        .findBySale_SaleId(saleId)
                        .map(Invoice::getInvoiceNumber)
                        .orElse(null);

        // =====================================================
        // RETURN DETAILS
        // =====================================================

        return new SalesHistoryDetailsResponse(
                "IN_STORE",
                sale.getSaleNumber(),
                sale.getCustomerName(),
                sale.getCustomerPhone(),
                null,
                sale.getTotalAmount(),
                sale.getTotalDiscount(),
                sale.getPaymentMethod(),
                sale.getCreatedAt(),
                invoiceNumber,
                items
        );
    }

    // =========================================================
    // ONLINE ORDER TRANSACTION DETAILS
    // =========================================================

    public SalesHistoryDetailsResponse getOnlineOrderDetails(
            Long orderId) {

        Order order =
                salesHistoryRepository
                        .findOnlineOrderById(orderId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Online order not found"
                                )
                        );

        List<OrderItem> orderItems =
                orderItemRepository
                        .findByOrder_OrderId(orderId);

        List<SalesHistoryItemResponse> items =
                new ArrayList<>();

        // =====================================================
        // ADD ORDER ITEMS
        // =====================================================

        for (OrderItem item : orderItems) {

            items.add(
                    new SalesHistoryItemResponse(
                            item.getVariant()
                                    .getProduct()
                                    .getProductName(),
                            item.getVariant().getColor(),
                            item.getVariant().getSize(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getDiscount(),
                            item.getFinalPrice()
                    )
            );
        }

        // =====================================================
        // GET INVOICE NUMBER
        // =====================================================

        String invoiceNumber =
                invoiceRepository
                        .findByOrder_OrderId(orderId)
                        .map(Invoice::getInvoiceNumber)
                        .orElse(null);

        // =====================================================
        // GET TOTAL DISCOUNT
        // =====================================================

        BigDecimal onlineDiscount =
                orderItemRepository
                        .getTotalDiscountByOrderId(orderId);

        if (onlineDiscount == null) {
            onlineDiscount = BigDecimal.ZERO;
        }

        // =====================================================
        // RETURN DETAILS
        // =====================================================

        return new SalesHistoryDetailsResponse(
                "ONLINE",
                order.getOrderNumber(),
                order.getCustomer().getName(),
                order.getPhoneSnapshot(),
                order.getAddressSnapshot(),
                order.getTotalAmount(),
                onlineDiscount,
                "ONLINE",
                order.getCreatedAt(),
                invoiceNumber,
                items
        );
    }
}