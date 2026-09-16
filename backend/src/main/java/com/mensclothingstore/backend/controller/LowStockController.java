package com.mensclothingstore.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.LowStockResponse;
import com.mensclothingstore.backend.service.LowStockService;

@RestController
@RequestMapping("/api/inventory")
public class LowStockController {

    private final LowStockService lowStockService;

    public LowStockController(LowStockService lowStockService) {
        this.lowStockService = lowStockService;
    }

    @GetMapping("/low-stock")
    public List<LowStockResponse> getLowStockVariants() {
        return lowStockService.getLowStockVariants();
    }
}