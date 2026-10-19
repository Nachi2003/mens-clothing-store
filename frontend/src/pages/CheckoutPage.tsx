import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getLoggedInUser } from "../services/authService";
import { getBackendCart } from "../services/backendCartService";
import type { BackendCartItem } from "../services/backendCartService";
import { getCartItems, clearCart } from "../services/cartService";
import type { CartItem } from "../services/cartService";
import { placeBuyNowOrder, placeOrder } from "../services/orderService";
import { getCustomerAddress } from "../services/customerAddressService";

interface BuyNowItem {
  productId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CheckoutDisplayItem {
  key: string;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const isBuyNow = new URLSearchParams(window.location.search).get("mode") === "buy-now";

  const [checkoutItems, setCheckoutItems] = useState<CheckoutDisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
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
        const savedAddress = await getCustomerAddress();
        if (savedAddress) {
          setAddress([savedAddress.address, savedAddress.city, savedAddress.state, savedAddress.pincode]
            .filter(Boolean).join(", "));
        }
      } catch (addressError) {
        console.warn("Could not load saved address:", addressError);
      }

      try {
        setLoading(true);
        setError("");

        if (isBuyNow) {
          // Buy Now uses only the temporary selection; do not load or alter the cart.
          const savedSelection = sessionStorage.getItem("buyNowItem");

          if (!savedSelection) {
            setError("Your Buy Now selection could not be found. Please select the product again.");
            return;
          }

          let item: BuyNowItem;
          try {
            item = JSON.parse(savedSelection) as BuyNowItem;
          } catch {
            sessionStorage.removeItem("buyNowItem");
            setError("Your Buy Now selection is invalid. Please select the product again.");
            return;
          }

          if (
            !item ||
            !Number.isFinite(Number(item.variantId)) ||
            !Number.isFinite(Number(item.quantity)) ||
            Number(item.variantId) <= 0 ||
            Number(item.quantity) <= 0 ||
            !item.productName
          ) {
            sessionStorage.removeItem("buyNowItem");
            setError("Your Buy Now selection is invalid. Please select the product again.");
            return;
          }

          const quantity = Number(item.quantity);
          const price = Number(item.price);

          setCheckoutItems([{
            key: `buy-now-${item.variantId}`,
            variantId: Number(item.variantId),
            productName: item.productName,
            size: item.size,
            color: item.color,
            unitPrice: price,
            quantity,
            imageUrl: item.imageUrl || "",
          }]);
          setTotal(price * quantity);
          return;
        }

        // Normal checkout continues to use the backend cart as before.
        const cart = await getBackendCart();

        if (!cart.items || cart.items.length === 0) {
          navigate("/cart");
          return;
        }

        const localItems: CartItem[] = getCartItems();
        const displayItems: CheckoutDisplayItem[] = cart.items.map(
          (item: BackendCartItem) => ({
            key: `cart-${item.cartItemId}`,
            variantId: item.variantId,
            productName: item.productName,
            size: item.size,
            color: item.color,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            imageUrl:
              localItems.find((localItem) => localItem.variantId === item.variantId)?.imageUrl ?? "",
          })
        );

        setCheckoutItems(displayItems);
        setTotal(Number(cart.totalAmount));
      } catch (err) {
        console.error("Failed to load checkout:", err);
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
  }, [navigate, isBuyNow]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      if (isBuyNow) {
        const savedSelection = sessionStorage.getItem("buyNowItem");
        if (!savedSelection) {
          throw new Error("Your Buy Now selection has expired. Please select the product again.");
        }

        const item = JSON.parse(savedSelection) as BuyNowItem;
        const placedOrder = await placeBuyNowOrder({
          variantId: Number(item.variantId),
          quantity: Number(item.quantity),
          phone: phone.trim(),
          address: address.trim(),
          paymentMethod,
        });

        sessionStorage.setItem("lastPlacedOrder", JSON.stringify({
          ...placedOrder,
          paymentMethod,
          items: checkoutItems,
          totalAmount: total,
        }));
        // Remove only the temporary Buy Now selection. Keep the user's cart intact.
        sessionStorage.removeItem("buyNowItem");
      } else {
        const placedOrder = await placeOrder({
  phone: phone.trim(),
  address: address.trim(),
  paymentMethod,
});

sessionStorage.setItem(
  "lastPlacedOrder",
  JSON.stringify({
    ...placedOrder,
    paymentMethod,
    items: checkoutItems,
    totalAmount: total,
    phone: phone.trim(),
    address: address.trim(),
  })
);

clearCart();

        // Save the confirmed order and the checkout snapshot for the success page.
        sessionStorage.setItem("lastPlacedOrder", JSON.stringify({
          ...placedOrder,
          phoneSnapshot: phone.trim(),
          addressSnapshot: address.trim(),
          paymentMethod,
          paymentStatus: placedOrder?.paymentStatus ?? "PENDING",
          items: checkoutItems,
          totalAmount: placedOrder?.totalAmount ?? total,
        }));

        // Clear the cart only after the backend confirms the order was created.
        clearCart();
      }

      // Show the congratulations page only for normal cart checkout.
      // Buy Now goes to the orders list and leaves unrelated cart items untouched.
     navigate("/order-success");
    } catch (submitError) {
      console.error("Checkout error:", submitError);
      const message = submitError instanceof Error
        ? submitError.message
        : "Unable to place your order. Please try again.";
      setError(message);
      alert(message);
    } finally {
      setPlacingOrder(false);
    }
  };

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

  if (error && checkoutItems.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-header">
            <Link to="/cart" className="checkout-back">← Back to Bag</Link>
            <h1>Checkout</h1>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              TRY AGAIN
            </button>
            {isBuyNow && (
              <button type="button" onClick={() => navigate(-1)}>
                BACK TO PRODUCT
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <Link to="/cart" className="checkout-back">← Back to Bag</Link>
          <h1>Checkout</h1>
          <p>
            {isBuyNow
              ? "Complete your details to purchase this item."
              : "Complete your details to place your L’ATELIER order."}
          </p>
        </div>

        <div className="checkout-layout">
          <section className="checkout-details">
            <div className="checkout-section">
              <div className="checkout-section-title">
                <span>01</span>
                <h2>Delivery Details</h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="checkout-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter your phone number"
                    maxLength={20}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="address">Delivery Address</label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Enter your complete delivery address"
                    rows={5}
                    maxLength={1000}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select id="paymentMethod" value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as "COD" | "UPI")}>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="UPI">UPI (payment verification required)</option>
                  </select>
                  {paymentMethod === "UPI" && <small>Order will be recorded as payment pending until a verified UPI payment is integrated.</small>}
                </div>

                {error && <p className="checkout-error" role="alert">{error}</p>}

                <button
                  type="submit"
                  className="checkout-place-order"
                  disabled={placingOrder || checkoutItems.length === 0}
                >
                  {placingOrder
                    ? "Processing..."
                    : isBuyNow
                      ? "Place Buy Now Order"
                      : "Continue to Place Order"}
                </button>
              </form>
            </div>
          </section>

          <aside className="checkout-summary">
            <div className="checkout-section-title">
              <span>02</span>
              <h2>Order Summary</h2>
            </div>

            <div className="checkout-items">
              {checkoutItems.map((item) => (
                <div className="checkout-item" key={item.key}>
                  <div className="checkout-item-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} />
                    ) : (
                      <div className="checkout-no-image">UNIQUE ZONE</div>
                    )}
                  </div>

                  <div className="checkout-item-info">
                    <h3>{item.productName}</h3>
                    <p>{item.color} / {item.size}</p>
                    <p>Qty: {item.quantity}</p>
                  </div>

                  <div className="checkout-item-price">
                    ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-summary-line">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</span>
            </div>

            <div className="checkout-summary-line">
              <span>Delivery</span>
              <span>Free</span>
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <strong>₹{total.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</strong>
            </div>

            <p className="checkout-note">
              Your order will be confirmed after successful placement.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
