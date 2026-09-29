import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
} from "../services/cartService";

import type { CartItem } from "../services/cartService";

function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart items
  useEffect(() => {
    setCartItems(getCartItems());
  }, []);

  // Remove item
  const handleRemove = (variantId: number) => {
    const updatedCart = removeFromCart(variantId);
    setCartItems(updatedCart);
  };

  // Update quantity
  const handleQuantityChange = (
    variantId: number,
    quantity: number
  ) => {
    const updatedCart = updateCartQuantity(variantId, quantity);
    setCartItems(updatedCart);
  };

  // Empty cart
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

      <div className="cart-layout">
        {/* Cart Items */}
        <section className="cart-items">
          {cartItems.map((item) => (
            <article
              className="cart-item"
              key={item.variantId}
            >
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="cart-item-image"
              />

              <div className="cart-item-details">
                <h2>{item.productName}</h2>

                <p>Color: {item.color}</p>
                <p>Size: {item.size}</p>

                <p className="cart-item-price">
                  ₹{item.price.toLocaleString("en-IN")}
                </p>

                <div className="cart-quantity">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuantityChange(
                        item.variantId,
                        item.quantity - 1
                      )
                    }
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuantityChange(
                        item.variantId,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-remove-button"
                  onClick={() => handleRemove(item.variantId)}
                >
                  REMOVE
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Order Summary */}
        <aside className="cart-summary">
          <h2>ORDER SUMMARY</h2>

          <div className="cart-summary-row">
            <span>Subtotal</span>

            <span>
              ₹{getCartTotal().toLocaleString("en-IN")}
            </span>
          </div>

          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="cart-summary-total">
            <span>Total</span>

            <span>
              ₹{getCartTotal().toLocaleString("en-IN")}
            </span>
          </div>

          <button
            type="button"
            className="cart-checkout-button"
            disabled
          >
            CHECKOUT
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