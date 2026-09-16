package com.mensclothingstore.backend.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.AddToCartRequest;
import com.mensclothingstore.backend.dto.CartDetailsResponse;
import com.mensclothingstore.backend.dto.CartItemResponse;
import com.mensclothingstore.backend.dto.CartResponse;
import com.mensclothingstore.backend.dto.UpdateCartItemRequest;
import com.mensclothingstore.backend.service.CartService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    // Add item to cart
    @PostMapping("/{userId}/cart/items")
    public CartResponse addToCart(
            @PathVariable Long userId,
            @Valid @RequestBody AddToCartRequest request) {

        return cartService.addToCart(userId, request);
    }

    // Get complete cart with total amount
    @GetMapping("/{userId}/cart/items")
    public CartDetailsResponse getCartItems(
            @PathVariable Long userId) {

        return cartService.getCartItems(userId);
    }

    // Update cart item quantity
    @PutMapping("/{userId}/cart/items/{cartItemId}")
    public CartItemResponse updateCartItem(
            @PathVariable Long userId,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {

        return cartService.updateCartItem(
                userId,
                cartItemId,
                request
        );
    }

    // Remove item from cart
    @DeleteMapping("/{userId}/cart/items/{cartItemId}")
    public String removeCartItem(
            @PathVariable Long userId,
            @PathVariable Long cartItemId) {

        cartService.removeCartItem(userId, cartItemId);

        return "Cart item removed successfully";
    }
}