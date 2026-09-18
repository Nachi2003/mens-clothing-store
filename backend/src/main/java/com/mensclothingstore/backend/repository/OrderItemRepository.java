package com.mensclothingstore.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mensclothingstore.backend.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrder_OrderId(Long orderId);

    @Query("""
            SELECT COALESCE(SUM(oi.discount * oi.quantity), 0)
            FROM OrderItem oi
            WHERE oi.order.orderId = :orderId
            """)
    BigDecimal getTotalDiscountByOrderId(
            @Param("orderId") Long orderId
    );
}