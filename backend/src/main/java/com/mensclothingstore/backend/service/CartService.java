package com.mensclothingstore.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.AddToCartRequest;
import com.mensclothingstore.backend.dto.CartDetailsResponse;
import com.mensclothingstore.backend.dto.CartItemResponse;
import com.mensclothingstore.backend.dto.CartResponse;
import com.mensclothingstore.backend.dto.UpdateCartItemRequest;
import com.mensclothingstore.backend.entity.Cart;
import com.mensclothingstore.backend.entity.CartItem;
import com.mensclothingstore.backend.entity.ProductVariant;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.CartItemRepository;
import com.mensclothingstore.backend.repository.CartRepository;
import com.mensclothingstore.backend.repository.ProductVariantRepository;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;

    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ProductVariantRepository productVariantRepository) {

        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // Add item to cart
    public CartResponse addToCart(
            Long userId,
            AddToCartRequest request) {

        User customer = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Customer not found"));

        ProductVariant variant =
                productVariantRepository.findById(request.getVariantId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product variant not found"));

        if (!variant.getActive()) {
            throw new RuntimeException(
                    "This product variant is not available");
        }

        Cart cart = cartRepository.findByCustomer_UserId(userId)
                .orElseGet(() -> {

                    Cart newCart = new Cart();
                    newCart.setCustomer(customer);

                    return cartRepository.save(newCart);
                });

        CartItem cartItem =
                cartItemRepository
                        .findByCart_CartIdAndVariant_VariantId(
                                cart.getCartId(),
                                variant.getVariantId())
                        .orElse(null);

        if (cartItem != null) {

            cartItem.setQuantity(
                    cartItem.getQuantity() + request.getQuantity());

            cartItemRepository.save(cartItem);

        } else {

            CartItem newCartItem = new CartItem();

            newCartItem.setCart(cart);
            newCartItem.setVariant(variant);
            newCartItem.setQuantity(request.getQuantity());

            cartItemRepository.save(newCartItem);
        }

        return new CartResponse(
                cart.getCartId(),
                customer.getUserId(),
                cart.getCreatedAt()
        );
    }

    // Get complete cart with total amount
    public CartDetailsResponse getCartItems(Long userId) {

        Cart cart = cartRepository.findByCustomer_UserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        List<CartItem> cartItems =
                cartItemRepository.findByCart_CartId(
                        cart.getCartId());

        List<CartItemResponse> items = cartItems.stream()
                .map(cartItem -> {

                    ProductVariant variant =
                            cartItem.getVariant();

                    BigDecimal unitPrice =
                            variant.getPrice();

                    BigDecimal subtotal =
                            unitPrice.multiply(
                                    BigDecimal.valueOf(
                                            cartItem.getQuantity()
                                    )
                            );

                    return new CartItemResponse(
                            cartItem.getCartItemId(),
                            variant.getVariantId(),
                            variant.getProduct().getProductName(),
                            variant.getSize(),
                            variant.getColor(),
                            unitPrice,
                            cartItem.getQuantity(),
                            subtotal
                    );
                })
                .toList();

        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add
                );

        return new CartDetailsResponse(
                cart.getCartId(),
                userId,
                items,
                totalAmount
        );
    }

    // Update cart item quantity
    public CartItemResponse updateCartItem(
            Long userId,
            Long cartItemId,
            UpdateCartItemRequest request) {

        Cart cart = cartRepository.findByCustomer_UserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        CartItem cartItem =
                cartItemRepository.findById(cartItemId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cart item not found"));

        if (!cartItem.getCart().getCartId()
                .equals(cart.getCartId())) {

            throw new RuntimeException(
                    "Cart item does not belong to this customer");
        }

        cartItem.setQuantity(request.getQuantity());

        CartItem updatedItem =
                cartItemRepository.save(cartItem);

        ProductVariant variant =
                updatedItem.getVariant();

        BigDecimal unitPrice =
                variant.getPrice();

        BigDecimal subtotal =
                unitPrice.multiply(
                        BigDecimal.valueOf(
                                updatedItem.getQuantity()
                        )
                );

        return new CartItemResponse(
                updatedItem.getCartItemId(),
                variant.getVariantId(),
                variant.getProduct().getProductName(),
                variant.getSize(),
                variant.getColor(),
                unitPrice,
                updatedItem.getQuantity(),
                subtotal
        );
    }

    // Remove item from cart
    public void removeCartItem(
            Long userId,
            Long cartItemId) {

        Cart cart = cartRepository.findByCustomer_UserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("Cart not found"));

        CartItem cartItem =
                cartItemRepository.findById(cartItemId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cart item not found"));

        if (!cartItem.getCart().getCartId()
                .equals(cart.getCartId())) {

            throw new RuntimeException(
                    "Cart item does not belong to this customer");
        }

        cartItemRepository.delete(cartItem);
    }
}