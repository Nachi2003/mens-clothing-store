package com.mensclothingstore.backend.controller;

import com.mensclothingstore.backend.dto.InvoiceResponse;
import com.mensclothingstore.backend.service.InvoicePdfService;
import com.mensclothingstore.backend.service.InvoiceService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    public InvoiceController(
            InvoiceService invoiceService,
            InvoicePdfService invoicePdfService) {

        this.invoiceService = invoiceService;
        this.invoicePdfService = invoicePdfService;
    }

    @PostMapping("/sale/{saleId}")
    public InvoiceResponse createInvoiceForSale(
            @PathVariable Long saleId) {

        return invoiceService.createInvoiceForSale(saleId);
    }

    @PostMapping("/order/{orderId}")
    public InvoiceResponse createInvoiceForOrder(
            @PathVariable Long orderId) {

        return invoiceService.createInvoiceForOrder(orderId);
    }

    @GetMapping("/sale/{saleId}/pdf")
    public ResponseEntity<byte[]> downloadSaleInvoice(
            @PathVariable Long saleId) {

        byte[] pdf =
                invoicePdfService.generateSaleInvoicePdf(saleId);

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_PDF);

        headers.setContentDisposition(
                ContentDisposition
                        .attachment()
                        .filename("invoice-" + saleId + ".pdf")
                        .build()
        );

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }

    @GetMapping("/order/{orderId}/pdf")
    public ResponseEntity<byte[]> downloadOrderInvoice(
            @PathVariable Long orderId) {

        byte[] pdf =
                invoicePdfService.generateOrderInvoicePdf(orderId);

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_PDF);

        headers.setContentDisposition(
                ContentDisposition
                        .attachment()
                        .filename("order-invoice-" + orderId + ".pdf")
                        .build()
        );

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
    @GetMapping("/sale/{saleId}")
public InvoiceResponse getInvoiceForSale(
        @PathVariable Long saleId) {

    return invoiceService.getInvoiceForSale(saleId);
}

@GetMapping("/order/{orderId}")
public InvoiceResponse getInvoiceForOrder(
        @PathVariable Long orderId) {

    return invoiceService.getInvoiceForOrder(orderId);
}
}