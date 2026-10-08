import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getLoggedInUser } from "../services/authService";

import {
  getBackendCart,
} from "../services/backendCartService";

import type {
  BackendCartItem,
} from "../services/backendCartService";

import { getCartItems, clearCart } from "../services/cartService";
import type { CartItem } from "../services/cartService";

import { placeOrder } from "../services/orderService";

function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<BackendCartItem[]>([]);
  const [total, setTotal] = useState(0);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      const user = getLoggedInUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setPhone(user.phone || "");

      try {
        setLoading(true);
        setError("");

        // Load the actual backend cart
        const cart = await getBackendCart();

        if (!cart.items || cart.items.length === 0) {
          navigate("/cart");
          return;
        }

        setCartItems(cart.items);
        setTotal(Number(cart.totalAmount));
      } catch (err) {
        console.error("Failed to load checkout cart:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your shopping bag."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [navigate]);

  /*
   * Get product image from the existing local cart.
   * BackendCartItem currently does not contain imageUrl.
   */
  const getItemImage = (variantId: number): string => {
    const localItems: CartItem[] = getCartItems();

    return (
      localItems.find(
        (item) => item.variantId === variantId
      )?.imageUrl ?? ""
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      // Place the order through the Spring Boot backend
      await placeOrder({
        phone: phone.trim(),
        address: address.trim(),
      });

      /*
       * Backend successfully placed the order and
       * clears the database cart.
       *
       * Clear the old local cart as well so the
       * frontend does not show the purchased items.
       */
      clearCart();

      alert("Your order has been placed successfully!");

      // Temporary destination.
      // We will create a proper Order Confirmation page next.
      navigate("/cart");

    } catch (error) {
      console.error("Checkout error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to place your order. Please try again."
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-header">
            <h1>Checkout</h1>
            <p>Loading your order...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error
  if (error && cartItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-header">
            <Link
              to="/cart"
              className="checkout-back"
            >
              ← Back to Bag
            </Link>

            <h1>Checkout</h1>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">

        {/* Header */}
        <div className="checkout-header">
          <Link
            to="/cart"
            className="checkout-back"
          >
            ← Back to Bag
          </Link>

          <h1>Checkout</h1>

          <p>
            Complete your details to place your
            L’ATELIER order.
          </p>
        </div>

        <div className="checkout-layout">

          {/* Delivery Details */}
          <section className="checkout-details">

            <div className="checkout-section">

              <div className="checkout-section-title">
                <span>01</span>
                <h2>Delivery Details</h2>
              </div>

              <form onSubmit={handleSubmit}>

                <div className="checkout-field">

                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Enter your phone number"
                    maxLength={20}
                  />

                </div>

                <div className="checkout-field">

                  <label htmlFor="address">
                    Delivery Address
                  </label>

                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    placeholder="Enter your complete delivery address"
                    rows={5}
                    maxLength={1000}
                  />

                </div>

                <button
                  type="submit"
                  className="checkout-place-order"
                  disabled={placingOrder}
                >
                  {placingOrder
                    ? "Processing..."
                    : "Continue to Place Order"}
                </button>

              </form>

            </div>

          </section>

          {/* Order Summary */}
          <aside className="checkout-summary">

            <div className="checkout-section-title">
              <span>02</span>
              <h2>Order Summary</h2>
            </div>

            <div className="checkout-items">

              {cartItems.map((item) => {

                const imageUrl = getItemImage(
                  item.variantId
                );

                return (
                  <div
                    className="checkout-item"
                    key={item.cartItemId}
                  >

                    <div className="checkout-item-image">

                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.productName}
                        />
                      ) : (
                        <div className="checkout-no-image">
                          L’ATELIER
                        </div>
                      )}

                    </div>

                    <div className="checkout-item-info">

                      <h3>
                        {item.productName}
                      </h3>

                      <p>
                        {item.color} / {item.size}
                      </p>

                      <p>
                        Qty: {item.quantity}
                      </p>

                    </div>

                    <div className="checkout-item-price">

                      ₹
                      {(
                        Number(item.unitPrice) *
                        item.quantity
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}

                    </div>

                  </div>
                );
              })}

            </div>

            <div className="checkout-summary-line">

              <span>Subtotal</span>

              <span>
                ₹
                {total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

            </div>

            <div className="checkout-summary-line">

              <span>Delivery</span>

              <span>Free</span>

            </div>

            <div className="checkout-total">

              <span>Total</span>

              <strong>
                ₹
                {total.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>

            </div>

            <p className="checkout-note">
              Your order will be confirmed after
              successful placement.
            </p>

          </aside>

        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;