package com.mensclothingstore.backend.controller;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mensclothingstore.backend.dto.OrderDetailsResponse;
import com.mensclothingstore.backend.dto.OrderItemResponse;
import com.mensclothingstore.backend.dto.OrderResponse;
import com.mensclothingstore.backend.dto.PlaceOrderRequest;
import com.mensclothingstore.backend.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null
                || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }

        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user");
        }
    }

    private void verifyCustomerAccess(
            Long requestedUserId,
            Authentication authentication) {

        Long authenticatedUserId =
                getAuthenticatedUserId(authentication);

        boolean isAdminOrStaff = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_STAFF"));

        if (!isAdminOrStaff
                && !authenticatedUserId.equals(requestedUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access another customer's orders");
        }
    }

    @PostMapping("/{userId}/orders")
    public OrderResponse placeOrder(
            @PathVariable Long userId,
            @Valid @RequestBody PlaceOrderRequest request,
            Authentication authentication) {

        verifyCustomerAccess(userId, authentication);

        return orderService.placeOrder(userId, request);
    }

    @GetMapping("/{userId}/orders")
    public List<OrderResponse> getCustomerOrders(
            @PathVariable Long userId,
            Authentication authentication) {

        verifyCustomerAccess(userId, authentication);

        return orderService.getCustomerOrders(userId);
    }

    @GetMapping("/orders/{orderId}/items")
    public List<OrderItemResponse> getOrderItems(
            @PathVariable Long orderId,
            Authentication authentication) {

        Long userId = getAuthenticatedUserId(authentication);

        boolean isAdminOrStaff = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN")
                        || authority.getAuthority().equals("ROLE_STAFF"));

        if (isAdminOrStaff) {
            return orderService.getOrderItems(orderId);
        }

        // getOrderDetails checks that the order belongs to this customer.
        orderService.getOrderDetails(userId, orderId);

        return orderService.getOrderItems(orderId);
    }

    @GetMapping("/{userId}/orders/{orderId}")
    public OrderDetailsResponse getOrderDetails(
            @PathVariable Long userId,
            @PathVariable Long orderId,
            Authentication authentication) {

        verifyCustomerAccess(userId, authentication);

        return orderService.getOrderDetails(userId, orderId);
    }

    @PutMapping("/{userId}/orders/{orderId}/cancel")
    public OrderResponse cancelOrder(
            @PathVariable Long userId,
            @PathVariable Long orderId,
            Authentication authentication) {

        verifyCustomerAccess(userId, authentication);

        return orderService.cancelOrder(userId, orderId);
    }

    @GetMapping("/admin/orders")
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    @PutMapping("/admin/orders/{orderId}/status")
    public OrderResponse updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {

        return orderService.updateOrderStatus(orderId, status);
    }
}