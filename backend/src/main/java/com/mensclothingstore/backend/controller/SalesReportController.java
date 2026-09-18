package com.mensclothingstore.backend.controller;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.SalesReportResponse;
import com.mensclothingstore.backend.service.SalesReportService;

@RestController
@RequestMapping("/api/admin/reports")
public class SalesReportController {

    private final SalesReportService salesReportService;

    public SalesReportController(SalesReportService salesReportService) {
        this.salesReportService = salesReportService;
    }

    @GetMapping("/sales")
    public SalesReportResponse getSalesReport(
            @RequestParam(required = false) String period,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {

        // Predefined period
        if (period != null && !period.isBlank()) {
            return salesReportService.getSalesReportByPeriod(period);
        }

        // Custom date range
        if (start != null && end != null) {
            return salesReportService.getSalesReport(start, end);
        }

        throw new IllegalArgumentException(
                "Provide either period or both start and end"
        );
    }
}