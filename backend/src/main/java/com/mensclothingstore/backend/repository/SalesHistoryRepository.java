package com.mensclothingstore.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.Order;

public interface SalesHistoryRepository extends JpaRepository<InStoreSale, Long> {

    @Query("""
            SELECT s
            FROM InStoreSale s
            WHERE s.createdAt >= :start
              AND s.createdAt < :end
            ORDER BY s.createdAt DESC
            """)
    List<InStoreSale> findInStoreSalesBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT o
            FROM Order o
            WHERE o.status = 'DELIVERED'
              AND o.createdAt >= :start
              AND o.createdAt < :end
            ORDER BY o.createdAt DESC
            """)
    List<Order> findOnlineSalesBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT o
            FROM Order o
            WHERE o.orderId = :orderId
            """)
    Optional<Order> findOnlineOrderById(
            @Param("orderId") Long orderId
    );
}