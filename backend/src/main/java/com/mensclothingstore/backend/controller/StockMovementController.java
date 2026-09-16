package com.mensclothingstore.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.StockAdjustmentRequest;
import com.mensclothingstore.backend.dto.StockAdjustmentResponse;
import com.mensclothingstore.backend.dto.StockInRequest;
import com.mensclothingstore.backend.dto.StockInResponse;
import com.mensclothingstore.backend.dto.StockMovementResponse;
import com.mensclothingstore.backend.service.StockMovementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    public StockMovementController(
            StockMovementService stockMovementService) {

        this.stockMovementService = stockMovementService;
    }

    @GetMapping
    public List<StockMovementResponse> getAllMovements() {

        return stockMovementService.getAllMovements();
    }

    @PostMapping("/stock-in")
    public StockInResponse stockIn(
            @Valid @RequestBody StockInRequest request) {

        return stockMovementService.stockIn(request);
    }

    @PostMapping("/adjust")
    public StockAdjustmentResponse adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request) {

        return stockMovementService.adjustStock(request);
    }
}