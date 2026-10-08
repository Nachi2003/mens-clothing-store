import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getLoggedInUser } from "../services/authService";
import {
  getBackendCart,
  removeFromBackendCart,
  updateBackendCartQuantity,
} from "../services/backendCartService";

import type { BackendCartItem } from "../services/backendCartService";

import { getCartItems } from "../services/cartService";
import type { CartItem } from "../services/cartService";

interface InventoryResponse {
  inventoryId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  updatedAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function CartPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<BackendCartItem[]>([]);
  const [stockByVariant, setStockByVariant] = useState<
    Record<number, number>
  >({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  // Load current stock for every variant in the cart.
  const loadInventory = useCallback(async (items: BackendCartItem[]) => {
    if (items.length === 0) {
      setStockByVariant({});
      setStockLoading(false);
      return;
    }

    setStockLoading(true);

    try {
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await axios.get<InventoryResponse>(
              `${API_BASE_URL}/api/inventory/variant/${item.variantId}`
            );

            return {
              variantId: item.variantId,
              quantity: Number(response.data.quantity ?? 0),
            };
          } catch (err) {
            console.error(
              `Could not load stock for variant ${item.variantId}:`,
              err
            );

            // Unknown stock must not be treated as available.
            return {
              variantId: item.variantId,
              quantity: 0,
            };
          }
        })
      );

      const stockMap: Record<number, number> = {};

      results.forEach((result) => {
        stockMap[result.variantId] = result.quantity;
      });

      setStockByVariant(stockMap);
    } finally {
      setStockLoading(false);
    }
  }, []);

  // Load the backend cart and its inventory.
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const cart = await getBackendCart();

      setCartItems(cart.items);
      setTotalAmount(Number(cart.totalAmount));

      await loadInventory(cart.items);
    } catch (err) {
      console.error("Failed to load cart:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your shopping bag."
      );
    } finally {
      setLoading(false);
    }
  }, [loadInventory]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  // Get product image from the existing local cart.
  const getItemImage = (variantId: number): string => {
    const localItems: CartItem[] = getCartItems();

    return (
      localItems.find((item) => item.variantId === variantId)?.imageUrl ?? ""
    );
  };

  const getStock = (variantId: number): number | undefined =>
    stockByVariant[variantId];

  // Flag items whose quantity exceeds the currently available stock.
  const hasStockProblem = cartItems.some((item) => {
    const stock = getStock(item.variantId);

    return (
      stock === undefined ||
      stock <= 0 ||
      item.quantity > stock
    );
  });

  // Remove a cart item.
  const handleRemove = async (cartItemId: number) => {
    try {
      setUpdatingItem(cartItemId);

      await removeFromBackendCart(cartItemId);
      await loadCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert("Unable to remove item from cart.");
    } finally {
      setUpdatingItem(null);
    }
  };

  // Update quantity only within the current stock limit.
  const handleQuantityChange = async (
    item: BackendCartItem,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    const stock = getStock(item.variantId);

    if (stock === undefined) {
      alert("Stock is still being checked. Please try again.");
      return;
    }

    if (stock <= 0) {
      alert("This item is currently out of stock.");
      return;
    }

    if (newQuantity > stock) {
      alert(
        `Only ${stock} item${stock === 1 ? "" : "s"} available.`
      );
      return;
    }

    try {
      setUpdatingItem(item.cartItemId);

      await updateBackendCartQuantity(item.cartItemId, newQuantity);
      await loadCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to update quantity."
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  if (loading) {
    return (
      <main className="cart-page">
        <h1>YOUR SHOPPING BAG</h1>
        <p>Loading your shopping bag...</p>
      </main>
    );
  }

  if (error) {
  const user = getLoggedInUser();

  return (
    <main className="cart-page">
      <h1>YOUR SHOPPING BAG</h1>
      <p>{error}</p>

      {!user ? (
        <button onClick={() => navigate("/login")}>
          LOGIN
        </button>
      ) : (
        <button onClick={() => window.location.reload()}>
          TRY AGAIN
        </button>
      )}
    </main>
  );
}

  if (cartItems.length === 0) {
    return (
      <main className="cart-page">
        <h1>YOUR SHOPPING BAG</h1>

        <div className="cart-empty">
          <p>Your shopping bag is empty.</p>

          <Link to="/shop" className="cart-continue-button">
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>YOUR SHOPPING BAG</h1>

      {hasStockProblem && !stockLoading && (
        <div className="cart-stock-warning" role="alert">
          <strong>Stock availability needs attention.</strong>
          <p>
            Reduce quantities to match available stock, or remove
            unavailable items before checkout.
          </p>
        </div>
      )}

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => {
            const stock = getStock(item.variantId);
            const isUpdating = updatingItem === item.cartItemId;
            const isOutOfStock = stock !== undefined && stock <= 0;
            const exceedsStock =
              stock !== undefined && item.quantity > stock;

            return (
              <article className="cart-item" key={item.cartItemId}>
                {getItemImage(item.variantId) && (
                  <img
                    src={getItemImage(item.variantId)}
                    alt={item.productName}
                    className="cart-item-image"
                  />
                )}

                <div className="cart-item-details">
                  <h2>{item.productName}</h2>

                  <p>Color: {item.color}</p>
                  <p>Size: {item.size}</p>

                  <p className="cart-item-price">
                    ₹{Number(item.unitPrice).toLocaleString("en-IN")}
                  </p>

                  {stockLoading || stock === undefined ? (
                    <p className="cart-stock-info">
                      Checking availability...
                    </p>
                  ) : isOutOfStock ? (
                    <p className="cart-stock-info cart-stock-out">
                      Out of stock
                    </p>
                  ) : exceedsStock ? (
                    <p className="cart-stock-info cart-stock-warning-text">
                      Only {stock} available. Reduce the quantity.
                    </p>
                  ) : stock < 10 ? (
                    <p className="cart-stock-info cart-stock-low">
                      Only {stock} left in stock
                    </p>
                  ) : (
                    <p className="cart-stock-info cart-stock-available">
                      In stock
                    </p>
                  )}

                  <div className="cart-quantity">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.productName}`}
                      disabled={isUpdating || item.quantity <= 1}
                      onClick={() =>
                        void handleQuantityChange(item, item.quantity - 1)
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.productName}`}
                      disabled={
                        isUpdating ||
                        stockLoading ||
                        stock === undefined ||
                        stock <= 0 ||
                        item.quantity >= stock
                      }
                      onClick={() =>
                        void handleQuantityChange(item, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove-button"
                    disabled={isUpdating}
                    onClick={() => void handleRemove(item.cartItemId)}
                  >
                    {isUpdating ? "PLEASE WAIT..." : "REMOVE"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="cart-summary">
          <h2>ORDER SUMMARY</h2>

          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="cart-summary-total">
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          {hasStockProblem && !stockLoading && (
            <p className="cart-checkout-warning" role="alert">
              Please adjust item quantities before continuing.
            </p>
          )}

          <button
            type="button"
            className="cart-checkout-button"
            disabled={stockLoading || hasStockProblem}
            onClick={() => navigate("/checkout")}
          >
            {stockLoading
              ? "CHECKING STOCK..."
              : hasStockProblem
                ? "ADJUST QUANTITY"
                : "CHECKOUT"}
          </button>

          <Link to="/shop" className="cart-continue-link">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;