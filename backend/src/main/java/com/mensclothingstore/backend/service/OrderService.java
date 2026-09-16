package com.mensclothingstore.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.dto.OrderDetailsResponse;
import com.mensclothingstore.backend.dto.OrderItemResponse;
import com.mensclothingstore.backend.dto.OrderResponse;
import com.mensclothingstore.backend.dto.PlaceOrderRequest;
import com.mensclothingstore.backend.entity.Cart;
import com.mensclothingstore.backend.entity.CartItem;
import com.mensclothingstore.backend.entity.Inventory;
import com.mensclothingstore.backend.entity.Order;
import com.mensclothingstore.backend.entity.OrderItem;
import com.mensclothingstore.backend.entity.StockMovement;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.CartItemRepository;
import com.mensclothingstore.backend.repository.CartRepository;
import com.mensclothingstore.backend.repository.InventoryRepository;
import com.mensclothingstore.backend.repository.OrderItemRepository;
import com.mensclothingstore.backend.repository.OrderRepository;
import com.mensclothingstore.backend.repository.StockMovementRepository;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            InventoryRepository inventoryRepository,
            StockMovementRepository stockMovementRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Transactional
    public OrderResponse placeOrder(
            Long userId,
            PlaceOrderRequest request) {

        // 1. Find customer
        User customer = userRepository.findById(userId)
                .orElseThrow(()
                        -> new RuntimeException("Customer not found"));

        // 2. Find customer's cart
        Cart cart = cartRepository.findByCustomer_UserId(userId)
                .orElseThrow(()
                        -> new RuntimeException("Cart not found"));

        // 3. Get cart items
        List<CartItem> cartItems
                = cartItemRepository.findByCart_CartId(
                        cart.getCartId());

        // 4. Check whether cart is empty
        if (cartItems.isEmpty()) {
            throw new RuntimeException(
                    "Cannot place order because cart is empty");
        }

        /*
         * 5. Check stock for every item.
         *
         * PESSIMISTIC_WRITE locks the inventory row
         * during this transaction.
         */
        for (CartItem cartItem : cartItems) {

            Long variantId
                    = cartItem.getVariant().getVariantId();

            Inventory inventory
                    = inventoryRepository
                            .findByVariantIdForUpdate(variantId)
                            .orElseThrow(()
                                    -> new RuntimeException(
                                    "Inventory not found for variant "
                                    + variantId));

            if (inventory.getQuantity()
                    < cartItem.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for "
                        + cartItem.getVariant()
                                .getProduct()
                                .getProductName()
                        + " "
                        + cartItem.getVariant().getSize()
                        + " "
                        + cartItem.getVariant().getColor()
                        + ". Available stock: "
                        + inventory.getQuantity()
                        + ", requested: "
                        + cartItem.getQuantity());
            }
        }

        /*
         * 6. Calculate total amount.
         */
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {

            BigDecimal unitPrice
                    = cartItem.getVariant().getPrice();

            BigDecimal subtotal
                    = unitPrice.multiply(
                            BigDecimal.valueOf(
                                    cartItem.getQuantity()
                            )
                    );

            totalAmount
                    = totalAmount.add(subtotal);
        }

        /*
         * 7. Create order.
         */
        Order order = new Order();

        order.setOrderNumber(generateOrderNumber());
        order.setCustomer(customer);
        order.setPhoneSnapshot(request.getPhone());
        order.setAddressSnapshot(request.getAddress());
        order.setTotalAmount(totalAmount);
        order.setStatus("PLACED");

        Order savedOrder
                = orderRepository.save(order);

        /*
         * 8. Create order items,
         *    deduct inventory,
         *    and record stock movements.
         */
        for (CartItem cartItem : cartItems) {

            Long variantId
                    = cartItem.getVariant().getVariantId();

            /*
             * Get the locked inventory row.
             */
            Inventory inventory
                    = inventoryRepository
                            .findByVariantIdForUpdate(variantId)
                            .orElseThrow(()
                                    -> new RuntimeException(
                                    "Inventory not found for variant "
                                    + variantId));

            /*
             * Final stock safety check.
             */
            if (inventory.getQuantity()
                    < cartItem.getQuantity()) {

                throw new RuntimeException(
                        "Insufficient stock for "
                        + cartItem.getVariant()
                                .getProduct()
                                .getProductName());
            }

            BigDecimal unitPrice
                    = cartItem.getVariant().getPrice();

            BigDecimal discount
                    = BigDecimal.ZERO;

            BigDecimal finalPrice
                    = unitPrice;

            /*
             * Deduct inventory.
             */
            inventory.setQuantity(
                    inventory.getQuantity()
                    - cartItem.getQuantity()
            );

            inventoryRepository.save(inventory);

            /*
             * Create order item.
             */
            OrderItem orderItem
                    = new OrderItem();

            orderItem.setOrder(savedOrder);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setDiscount(discount);
            orderItem.setFinalPrice(finalPrice);

            orderItemRepository.save(orderItem);

            /*
             * Record stock movement.
             */
            StockMovement movement
                    = new StockMovement();

            movement.setVariant(cartItem.getVariant());
            movement.setQuantityChange(
                    -cartItem.getQuantity()
            );
            movement.setMovementType("ONLINE_SALE");
            movement.setReferenceId(
                    savedOrder.getOrderNumber()
            );
            movement.setReason("Online order");

            stockMovementRepository.save(movement);
        }

        /*
         * 9. Clear the customer's cart.
         */
        cartItemRepository.deleteAll(cartItems);

        /*
         * 10. Return order response.
         */
        return new OrderResponse(
                savedOrder.getOrderId(),
                savedOrder.getOrderNumber(),
                customer.getUserId(),
                savedOrder.getPhoneSnapshot(),
                savedOrder.getAddressSnapshot(),
                savedOrder.getTotalAmount(),
                savedOrder.getStatus(),
                savedOrder.getCreatedAt() != null
                ? savedOrder.getCreatedAt()
                : LocalDateTime.now()
        );
    }

    public List<OrderResponse> getCustomerOrders(Long userId) {

        User customer = userRepository.findById(userId)
                .orElseThrow(()
                        -> new RuntimeException("Customer not found"));

        List<Order> orders
                = orderRepository.findByCustomer_UserId(userId);

        return orders.stream()
                .map(order -> new OrderResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                customer.getUserId(),
                order.getPhoneSnapshot(),
                order.getAddressSnapshot(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt()
        ))
                .toList();
    }

    public List<OrderItemResponse> getOrderItems(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(()
                        -> new RuntimeException("Order not found"));

        List<OrderItem> items
                = orderItemRepository.findByOrder_OrderId(orderId);

        return items.stream()
                .map(item -> {

                    BigDecimal subtotal
                            = item.getFinalPrice()
                                    .multiply(
                                            BigDecimal.valueOf(
                                                    item.getQuantity()
                                            )
                                    );

                    return new OrderItemResponse(
                            item.getOrderItemId(),
                            item.getVariant().getVariantId(),
                            item.getVariant()
                                    .getProduct()
                                    .getProductName(),
                            item.getVariant().getSize(),
                            item.getVariant().getColor(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getDiscount(),
                            item.getFinalPrice(),
                            subtotal
                    );
                })
                .toList();
    }

    public OrderDetailsResponse getOrderDetails(
            Long userId,
            Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(()
                        -> new RuntimeException("Order not found"));

        // Make sure the order belongs to this customer
        if (!order.getCustomer().getUserId().equals(userId)) {
            throw new RuntimeException(
                    "You are not authorized to view this order");
        }

        List<OrderItem> items
                = orderItemRepository.findByOrder_OrderId(orderId);

        List<OrderItemResponse> itemResponses
                = items.stream()
                        .map(item -> {

                            BigDecimal subtotal
                                    = item.getFinalPrice()
                                            .multiply(
                                                    BigDecimal.valueOf(
                                                            item.getQuantity()
                                                    )
                                            );

                            return new OrderItemResponse(
                                    item.getOrderItemId(),
                                    item.getVariant().getVariantId(),
                                    item.getVariant()
                                            .getProduct()
                                            .getProductName(),
                                    item.getVariant().getSize(),
                                    item.getVariant().getColor(),
                                    item.getQuantity(),
                                    item.getUnitPrice(),
                                    item.getDiscount(),
                                    item.getFinalPrice(),
                                    subtotal
                            );
                        })
                        .toList();

        return new OrderDetailsResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getCustomer().getUserId(),
                order.getPhoneSnapshot(),
                order.getAddressSnapshot(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt(),
                itemResponses
        );
    }

    @Transactional
    public OrderResponse cancelOrder(
            Long userId,
            Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(()
                        -> new RuntimeException("Order not found"));

        // Make sure this order belongs to the customer
        if (!order.getCustomer().getUserId().equals(userId)) {
            throw new RuntimeException(
                    "You are not authorized to cancel this order");
        }

        // Only PLACED orders can be cancelled
        if (!"PLACED".equals(order.getStatus())) {
            throw new RuntimeException(
                    "Order cannot be cancelled because its status is "
                    + order.getStatus());
        }

        List<OrderItem> orderItems
                = orderItemRepository.findByOrder_OrderId(orderId);

        for (OrderItem orderItem : orderItems) {

            Long variantId
                    = orderItem.getVariant().getVariantId();

            Inventory inventory
                    = inventoryRepository
                            .findByVariantIdForUpdate(variantId)
                            .orElseThrow(()
                                    -> new RuntimeException(
                                    "Inventory not found for variant "
                                    + variantId));

            // Restore stock
            inventory.setQuantity(
                    inventory.getQuantity()
                    + orderItem.getQuantity()
            );

            inventoryRepository.save(inventory);

            // Record stock restoration
            StockMovement movement
                    = new StockMovement();

            movement.setVariant(orderItem.getVariant());

            movement.setQuantityChange(
                    orderItem.getQuantity()
            );

            movement.setMovementType("ORDER_CANCELLED");

            movement.setReferenceId(
                    order.getOrderNumber()
            );

            movement.setReason("Order cancelled");

            stockMovementRepository.save(movement);
        }

        // Change order status
        order.setStatus("CANCELLED");

        Order savedOrder
                = orderRepository.save(order);

        return new OrderResponse(
                savedOrder.getOrderId(),
                savedOrder.getOrderNumber(),
                savedOrder.getCustomer().getUserId(),
                savedOrder.getPhoneSnapshot(),
                savedOrder.getAddressSnapshot(),
                savedOrder.getTotalAmount(),
                savedOrder.getStatus(),
                savedOrder.getCreatedAt()
        );
    }

    /*
     * Generate customer-facing order number.
     *
     * Example:
     * ORD-000001
     * ORD-000002
     */
    private String generateOrderNumber() {

        long nextNumber
                = orderRepository.count() + 1;

        return String.format(
                "ORD-%06d",
                nextNumber
        );
    }

    public List<OrderResponse> getAllOrders() {

        List<Order> orders
                = orderRepository.findAll();

        return orders.stream()
                .map(order -> new OrderResponse(
                order.getOrderId(),
                order.getOrderNumber(),
                order.getCustomer().getUserId(),
                order.getPhoneSnapshot(),
                order.getAddressSnapshot(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getCreatedAt()
        ))
                .toList();
    }

    @Transactional
public OrderResponse updateOrderStatus(Long orderId, String newStatus) {

    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

    String currentStatus = order.getStatus();

    // Admin cancellation
    if (newStatus.equals("CANCELLED")) {

        if (!currentStatus.equals("PLACED")) {
            throw new RuntimeException(
                    "Only PLACED orders can be cancelled"
            );
        }

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder_OrderId(orderId);

        for (OrderItem item : orderItems) {

            Inventory inventory = inventoryRepository
                    .findByVariantIdForUpdate(
                            item.getVariant().getVariantId()
                    )
                    .orElseThrow(() ->
                            new RuntimeException("Inventory not found")
                    );

            inventory.setQuantity(
                    inventory.getQuantity() + item.getQuantity()
            );

            inventoryRepository.save(inventory);

            StockMovement movement = new StockMovement();
            movement.setVariant(item.getVariant());
            movement.setQuantityChange(item.getQuantity());
            movement.setMovementType("ORDER_CANCELLED");
            movement.setReferenceId(order.getOrderNumber());
            movement.setReason("Order cancelled by admin");

            stockMovementRepository.save(movement);
        }

        order.setStatus("CANCELLED");

    } else {

        // Normal status workflow
        if (currentStatus.equals("PLACED")
                && !newStatus.equals("CONFIRMED")) {

            throw new RuntimeException("Invalid status transition");
        }

        if (currentStatus.equals("CONFIRMED")
                && !newStatus.equals("READY")) {

            throw new RuntimeException("Invalid status transition");
        }

        if (currentStatus.equals("READY")
                && !newStatus.equals("DELIVERED")) {

            throw new RuntimeException("Invalid status transition");
        }

        if (currentStatus.equals("DELIVERED")
                || currentStatus.equals("CANCELLED")) {

            throw new RuntimeException(
                    "Order cannot be updated because it is already "
                            + currentStatus
            );
        }

        order.setStatus(newStatus);
    }

    Order savedOrder = orderRepository.save(order);

    return new OrderResponse(
            savedOrder.getOrderId(),
            savedOrder.getOrderNumber(),
            savedOrder.getCustomer().getUserId(),
            savedOrder.getPhoneSnapshot(),
            savedOrder.getAddressSnapshot(),
            savedOrder.getTotalAmount(),
            savedOrder.getStatus(),
            savedOrder.getCreatedAt()
    );
}
}
