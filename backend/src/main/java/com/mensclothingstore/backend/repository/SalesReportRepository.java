package com.mensclothingstore.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mensclothingstore.backend.entity.InStoreSale;

public interface SalesReportRepository extends JpaRepository<InStoreSale, Long> {

    @Query("""
            SELECT COALESCE(SUM(s.totalAmount), 0)
            FROM InStoreSale s
            WHERE s.createdAt >= :start
              AND s.createdAt < :end
            """)
    BigDecimal getTotalInStoreSales(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COALESCE(SUM(s.totalDiscount), 0)
            FROM InStoreSale s
            WHERE s.createdAt >= :start
              AND s.createdAt < :end
            """)
    BigDecimal getTotalInStoreDiscount(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COUNT(s)
            FROM InStoreSale s
            WHERE s.createdAt >= :start
              AND s.createdAt < :end
            """)
    long getInStoreTransactionCount(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.status = 'DELIVERED'
              AND o.createdAt >= :start
              AND o.createdAt < :end
            """)
    BigDecimal getTotalOnlineSales(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.status = 'DELIVERED'
              AND o.createdAt >= :start
              AND o.createdAt < :end
            """)
    long getOnlineTransactionCount(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
    @Query("""
        SELECT COALESCE(SUM(oi.discount * oi.quantity), 0)
        FROM OrderItem oi
        WHERE oi.order.status = 'DELIVERED'
          AND oi.order.createdAt >= :start
          AND oi.order.createdAt < :end
        """)
BigDecimal getTotalOnlineDiscount(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
);
}