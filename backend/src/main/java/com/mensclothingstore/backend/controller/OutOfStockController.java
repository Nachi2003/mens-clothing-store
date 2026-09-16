package com.mensclothingstore.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.OutOfStockResponse;
import com.mensclothingstore.backend.service.OutOfStockService;

@RestController
@RequestMapping("/api/inventory")
public class OutOfStockController {

    private final OutOfStockService outOfStockService;

    public OutOfStockController(
            OutOfStockService outOfStockService) {

        this.outOfStockService = outOfStockService;
    }

    @GetMapping("/out-of-stock")
    public List<OutOfStockResponse> getOutOfStockVariants() {

        return outOfStockService.getOutOfStockVariants();
    }
}