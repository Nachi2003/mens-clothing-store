import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface SuccessItem {
  key?: string;
  productName?: string;
  size?: string;
  color?: string;
  quantity?: number;
  unitPrice?: number;
}

interface PlacedOrder {
  orderNumber?: string;
  orderId?: number;
  phoneSnapshot?: string;
  addressSnapshot?: string;
  address?: string;
  phone?: string;
  paymentMethod?: "COD" | "UPI";
  paymentStatus?: string;
  totalAmount?: number;
  items?: SuccessItem[];
}

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("lastPlacedOrder");
    if (!saved) return;
    try {
      setOrder(JSON.parse(saved) as PlacedOrder);
    } catch {
      setOrder(null);
    }
  }, []);

  if (!order) {
    return (
      <main className="order-success-page">
        <section className="order-success-card">
          <div className="order-success-mark">✓</div>
          <h1>Thank you for your order!</h1>
          <p>Your order has been placed successfully.</p>
          <p>Order details are not available in this session.</p>
          <div className="order-success-actions">
            <Link to="/orders" className="order-success-primary">View My Orders</Link>
            <Link to="/shop" className="order-success-secondary">Continue Shopping</Link>
          </div>
        </section>
      </main>
    );
  }

  const items = order.items ?? [];
  const total = Number(order.totalAmount ?? 0);
  const address = order.addressSnapshot ?? order.address ?? "Not provided";
  const paymentMethod = order.paymentMethod ?? "COD";

  return (
    <main className="order-success-page">
      <section className="order-success-card">
        <div className="order-success-mark" aria-hidden="true">✓</div>
        <p className="order-success-eyebrow">UNIQUE ZONE · THE FASHION GARAGE</p>
        <h1>Congratulations!</h1>
        <h2>Your order has been placed successfully.</h2>
        <p className="order-success-thanks">Thank you for shopping with us. Your order details are below.</p>

        <div className="order-success-number">
          <span>Order number</span>
          <strong>{order.orderNumber ?? (order.orderId ? `#${order.orderId}` : "Confirmed")}</strong>
        </div>

        <div className="order-success-details">
          <h3>Purchase details</h3>
          {items.length ? items.map((item, index) => (
            <div className="order-success-item" key={item.key ?? `${item.productName ?? "item"}-${index}`}>
              <div>
                <strong>{item.productName ?? "Product"}</strong>
                <p>{[item.color, item.size].filter(Boolean).join(" / ")}</p>
                <p>Quantity: {item.quantity ?? 1}</p>
              </div>
              <strong>₹{(Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          )) : <p>Your order is recorded. You can view its items in My Orders.</p>}

          <div className="order-success-total">
            <span>Total</span>
            <strong>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          <div className="order-success-meta">
            <div><span>Delivery address</span><strong>{address}</strong></div>
            <div><span>Phone</span><strong>{order.phoneSnapshot ?? order.phone ?? "—"}</strong></div>
            <div><span>Payment method</span><strong>{paymentMethod === "COD" ? "Cash on Delivery" : "UPI"}</strong></div>
            <div><span>Payment status</span><strong>{order.paymentStatus ?? "PENDING"}</strong></div>
          </div>
        </div>

        <div className="order-success-actions">
          <button type="button" className="order-success-primary" onClick={() => navigate("/orders")}>View My Orders</button>
          <Link to="/shop" className="order-success-secondary">Continue Shopping</Link>
        </div>
      </section>
    </main>
  );
}
