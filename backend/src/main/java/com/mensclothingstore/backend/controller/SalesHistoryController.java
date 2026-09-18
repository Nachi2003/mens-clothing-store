package com.mensclothingstore.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.SalesHistoryDetailsResponse;
import com.mensclothingstore.backend.dto.SalesHistoryResponse;
import com.mensclothingstore.backend.service.SalesHistoryService;

@RestController
@RequestMapping("/api/admin/reports")
public class SalesHistoryController {

    private final SalesHistoryService salesHistoryService;

    public SalesHistoryController(
            SalesHistoryService salesHistoryService) {

        this.salesHistoryService = salesHistoryService;
    }

    // =========================================================
    // SALES HISTORY
    // =========================================================

    @GetMapping("/sales-history")
    public List<SalesHistoryResponse> getSalesHistory(

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end,

            @RequestParam(required = false)
            String transactionNumber,

            @RequestParam(required = false)
            String invoiceNumber,

            @RequestParam(required = false)
            String customerName,

            @RequestParam(required = false)
            String customerPhone,

            @RequestParam(required = false)
            String transactionType) {

        return salesHistoryService.getSalesHistory(
                start,
                end,
                transactionNumber,
                invoiceNumber,
                customerName,
                customerPhone,
                transactionType
        );
    }

    // =========================================================
    // IN-STORE TRANSACTION DETAILS
    // =========================================================

    @GetMapping("/sales-history/in-store/{saleId}")
    public SalesHistoryDetailsResponse getInStoreSaleDetails(
            @PathVariable Long saleId) {

        return salesHistoryService.getInStoreSaleDetails(saleId);
    }

    // =========================================================
    // ONLINE ORDER TRANSACTION DETAILS
    // =========================================================

    @GetMapping("/sales-history/online/{orderId}")
    public SalesHistoryDetailsResponse getOnlineOrderDetails(
            @PathVariable Long orderId) {

        return salesHistoryService.getOnlineOrderDetails(orderId);
    }
}