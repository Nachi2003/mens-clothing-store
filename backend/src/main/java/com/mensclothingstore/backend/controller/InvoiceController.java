package com.mensclothingstore.backend.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.entity.Invoice;
import com.mensclothingstore.backend.service.InvoiceService;

@RestController
@RequestMapping("/api/admin/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/sale/{saleId}")
    public Invoice createInvoiceForSale(
            @PathVariable Long saleId) {

        return invoiceService.createInvoiceForSale(saleId);
    }

    @PostMapping("/order/{orderId}")
    public Invoice createInvoiceForOrder(
            @PathVariable Long orderId) {

        return invoiceService.createInvoiceForOrder(orderId);
    }
}