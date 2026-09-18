package com.mensclothingstore.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.SalesReportResponse;
import com.mensclothingstore.backend.repository.SalesReportRepository;

@Service
public class SalesReportService {

    private final SalesReportRepository salesReportRepository;

    public SalesReportService(SalesReportRepository salesReportRepository) {
        this.salesReportRepository = salesReportRepository;
    }

    public SalesReportResponse getSalesReport(
            LocalDateTime start,
            LocalDateTime end) {

        BigDecimal inStoreSales =
                salesReportRepository.getTotalInStoreSales(start, end);

        BigDecimal onlineSales =
                salesReportRepository.getTotalOnlineSales(start, end);

        BigDecimal inStoreDiscount =
                salesReportRepository.getTotalInStoreDiscount(start, end);

        BigDecimal onlineDiscount =
                salesReportRepository.getTotalOnlineDiscount(start, end);

        long inStoreTransactions =
                salesReportRepository.getInStoreTransactionCount(start, end);

        long onlineTransactions =
                salesReportRepository.getOnlineTransactionCount(start, end);

        BigDecimal totalSales =
                inStoreSales.add(onlineSales);

        BigDecimal totalDiscount =
                inStoreDiscount.add(onlineDiscount);

        long transactionCount =
                inStoreTransactions + onlineTransactions;

        return new SalesReportResponse(
                onlineSales,
                inStoreSales,
                totalSales,
                onlineDiscount,
                inStoreDiscount,
                totalDiscount,
                onlineTransactions,
                inStoreTransactions,
                transactionCount
        );
    }

    public SalesReportResponse getSalesReportByPeriod(String period) {

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime start;
        LocalDateTime end;

        switch (period.toUpperCase()) {

            case "TODAY":
                start = now.toLocalDate().atStartOfDay();
                end = start.plusDays(1);
                break;

            case "YESTERDAY":
                end = now.toLocalDate().atStartOfDay();
                start = end.minusDays(1);
                break;

            case "THIS_WEEK":
                start = now.toLocalDate()
                        .with(java.time.DayOfWeek.MONDAY)
                        .atStartOfDay();

                end = start.plusWeeks(1);
                break;

            case "THIS_MONTH":
                start = now.toLocalDate()
                        .withDayOfMonth(1)
                        .atStartOfDay();

                end = start.plusMonths(1);
                break;

            default:
                throw new IllegalArgumentException(
                        "Invalid report period. Use TODAY, YESTERDAY, THIS_WEEK or THIS_MONTH"
                );
        }

        return getSalesReport(start, end);
    }
}