package com.mensclothingstore.backend.dto;

import java.math.BigDecimal;

public class SalesReportResponse {

    private BigDecimal onlineSales;
    private BigDecimal inStoreSales;
    private BigDecimal totalSales;

    private BigDecimal onlineDiscount;
    private BigDecimal inStoreDiscount;
    private BigDecimal totalDiscount;

    private long onlineTransactionCount;
    private long inStoreTransactionCount;
    private long transactionCount;

    public SalesReportResponse(
            BigDecimal onlineSales,
            BigDecimal inStoreSales,
            BigDecimal totalSales,
            BigDecimal onlineDiscount,
            BigDecimal inStoreDiscount,
            BigDecimal totalDiscount,
            long onlineTransactionCount,
            long inStoreTransactionCount,
            long transactionCount) {

        this.onlineSales = onlineSales;
        this.inStoreSales = inStoreSales;
        this.totalSales = totalSales;
        this.onlineDiscount = onlineDiscount;
        this.inStoreDiscount = inStoreDiscount;
        this.totalDiscount = totalDiscount;
        this.onlineTransactionCount = onlineTransactionCount;
        this.inStoreTransactionCount = inStoreTransactionCount;
        this.transactionCount = transactionCount;
    }

    public BigDecimal getOnlineSales() {
        return onlineSales;
    }

    public BigDecimal getInStoreSales() {
        return inStoreSales;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public BigDecimal getOnlineDiscount() {
        return onlineDiscount;
    }

    public BigDecimal getInStoreDiscount() {
        return inStoreDiscount;
    }

    public BigDecimal getTotalDiscount() {
        return totalDiscount;
    }

    public long getOnlineTransactionCount() {
        return onlineTransactionCount;
    }

    public long getInStoreTransactionCount() {
        return inStoreTransactionCount;
    }

    public long getTransactionCount() {
        return transactionCount;
    }
}