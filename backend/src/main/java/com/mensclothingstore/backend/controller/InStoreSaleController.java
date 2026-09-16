package com.mensclothingstore.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.InStoreSaleRequest;
import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.service.InStoreSaleService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/sales")
public class InStoreSaleController {

    private final InStoreSaleService inStoreSaleService;

    public InStoreSaleController(InStoreSaleService inStoreSaleService) {
        this.inStoreSaleService = inStoreSaleService;
    }

    @PostMapping
    public InStoreSale createSale(
            @Valid @RequestBody InStoreSaleRequest request) {

        return inStoreSaleService.createSale(request);
    }
}