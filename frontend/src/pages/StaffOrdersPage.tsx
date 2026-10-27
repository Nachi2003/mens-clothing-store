import { useCallback, useEffect, useState } from "react";
import { getAuthToken, getLoggedInUser } from "../services/authService";
import { getProductImageUrl } from "../services/productImageService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface StaffOrderItem {
  orderItemId: number;
  productName: string;
  size: string;
  color: string;
  imageUrl?: string | null;
  quantity: number;
  subtotal: number;
}

interface StaffOrder {
  orderId: number;
  orderNumber: string;
  customerId: number;
  phone: string;
  address: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  declineReason?: string | null;
  customerAcknowledgedRejection?: boolean;
  customerAcknowledgedAt?: string | null;
  items: StaffOrderItem[];
}

function currency(value: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function statusLabel(value: string) {
  return (value || "UNKNOWN").replace(/_/g, " ");
}

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("ALL");

  const loadOrders = useCallback(async (quiet = false) => {
    const token = getAuthToken();
    const user = getLoggedInUser();
    if (!token || !user || !["ADMIN", "STAFF"].includes(user.role)) {
      setError("Please sign in with an admin or staff account to view orders.");
      setLoading(false);
      return;
    }

    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/customers/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Unable to load customer orders.");
      }
      const rawOrders = Array.isArray(data) ? data as StaffOrder[] : [];
      const withItems = await Promise.all(
        rawOrders.map(async (order) => {
          try {
            const itemsResponse = await fetch(
              `${API_BASE_URL}/api/customers/orders/${order.orderId}/items`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!itemsResponse.ok) return { ...order, items: [] };
            const items: StaffOrderItem[] = await itemsResponse.json();
            return { ...order, items };
          } catch {
            return { ...order, items: [] };
          }
        })
      );
      const sorted = withItems.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(sorted);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customer orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(order: StaffOrder, status: string, reason?: string) {
    const token = getAuthToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      setSavingId(order.orderId);
      setError("");
      setNotice("");
      const params = new URLSearchParams({ status });
      if (status === "CANCELLED") params.set("reason", (reason || "").trim());

      const response = await fetch(
        `${API_BASE_URL}/api/customers/admin/orders/${order.orderId}/status?${params.toString()}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Unable to update this order.");
      }

      setNotice(
        status === "CANCELLED"
          ? `Order ${order.orderNumber} was rejected.`
          : `Order ${order.orderNumber} updated to ${statusLabel(status)}.`
      );
      setRejectingId(null);
      setRejectionReason("");
      await loadOrders(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this order.");
    } finally {
      setSavingId(null);
    }
  }

  const visibleOrders = filter === "ALL"
    ? orders
    : orders.filter((order) => (order.status || "").toUpperCase() === filter);

  return (
    <section className="staff-orders-page">
      <header className="staff-orders-heading">
        <div>
          <span className="staff-orders-eyebrow">ORDER MANAGEMENT</span>
          <h1>Customer Orders</h1>
          <p>Review orders, confirm accepted orders, and provide a reason when rejecting.</p>
        </div>
        <button
          type="button"
          className="staff-orders-refresh"
          onClick={() => void loadOrders(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? "Refreshing…" : "Refresh orders"}
        </button>
      </header>

      <div className="staff-orders-toolbar">
        <div className="staff-orders-count">
          <strong>{orders.length}</strong>
          <span>total orders</span>
        </div>
        <label className="staff-orders-filter">
          <span>Filter status</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ALL">All orders</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="READY">Ready</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Rejected / Cancelled</option>
          </select>
        </label>
      </div>

      {notice && <p className="staff-orders-notice" role="status">{notice}</p>}
      {error && <p className="staff-orders-error" role="alert">{error}</p>}

      {loading ? (
        <div className="staff-orders-state">Loading orders…</div>
      ) : visibleOrders.length === 0 ? (
        <div className="staff-orders-state">
          <h2>No orders found</h2>
          <p>Orders matching this filter will appear here.</p>
        </div>
      ) : (
        <div className="staff-orders-list">
          {visibleOrders.map((order) => {
            const status = (order.status || "").toUpperCase();
            const isSaving = savingId === order.orderId;
            const isRejecting = rejectingId === order.orderId;
            return (
              <article className="staff-order-card" key={order.orderId}>
                <header className="staff-order-card-header">
                  <div>
                    <span className="staff-orders-muted">ORDER NUMBER</span>
                    <h2>{order.orderNumber}</h2>
                    <p>{dateLabel(order.createdAt)}</p>
                  </div>
                  <span className={`staff-order-status status-${status.toLowerCase()}`}>
                    {statusLabel(status)}
                  </span>
                </header>

                <div className="staff-order-details-grid">
                  <div>
                    <span className="staff-orders-muted">Customer ID</span>
                    <strong>#{order.customerId}</strong>
                  </div>
                  <div>
                    <span className="staff-orders-muted">Phone</span>
                    <strong>{order.phone || "Not provided"}</strong>
                  </div>
                  <div>
                    <span className="staff-orders-muted">Order total</span>
                    <strong>{currency(order.totalAmount)}</strong>
                  </div>
                  <div className="staff-order-address">
                    <span className="staff-orders-muted">Delivery address</span>
                    <p>{order.address || "Address unavailable"}</p>
                  </div>
                </div>

                <div className="staff-order-items">
                  <strong>Items ordered</strong>
                  {order.items.length ? (
                    <ul>
                      {order.items.map((item) => (
                        <li className="staff-order-item-row" key={item.orderItemId}>
                          <div className="staff-order-item-visual">
                            {item.imageUrl ? (
                              <img src={getProductImageUrl(item.imageUrl)}
                                alt={`${item.productName} in ${item.color}`} loading="lazy" />
                            ) : (
                              <span className="staff-order-item-placeholder">No image</span>
                            )}
                          </div>
                          <div className="staff-order-item-info">
                            <strong>{item.productName}</strong>
                            <span>Color: {item.color || "Not specified"}</span>
                            <span>Size: {item.size || "Not specified"} · Qty: {item.quantity}</span>
                          </div>
                          <strong className="staff-order-item-price">{currency(item.subtotal)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Item details are unavailable.</p>
                  )}
                </div>

                {order.declineReason && (
                  <div className="staff-order-rejection">
                    <strong>Rejection reason sent to customer</strong>
                    <p>{order.declineReason}</p>
                    <span className={order.customerAcknowledgedRejection ? "staff-ack-yes" : "staff-ack-pending"}>
                      {order.customerAcknowledgedRejection
                        ? `Customer acknowledged${order.customerAcknowledgedAt ? ` on ${dateLabel(order.customerAcknowledgedAt)}` : ""}`
                        : "Awaiting customer acknowledgement"}
                    </span>
                  </div>
                )}

                <div className="staff-order-actions">
                  {status === "PLACED" && !isRejecting && (
                    <>
                      <button
                        type="button"
                        className="staff-action-primary"
                        disabled={isSaving}
                        onClick={() => void updateStatus(order, "CONFIRMED")}
                      >
                        {isSaving ? "Saving…" : "Confirm order"}
                      </button>
                      <button
                        type="button"
                        className="staff-action-danger"
                        disabled={isSaving}
                        onClick={() => {
                          setRejectingId(order.orderId);
                          setRejectionReason("");
                          setError("");
                          setNotice("");
                        }}
                      >
                        Reject order
                      </button>
                    </>
                  )}
                  {status === "CONFIRMED" && (
                    <button type="button" className="staff-action-primary" disabled={isSaving}
                      onClick={() => void updateStatus(order, "READY")}>
                      {isSaving ? "Saving…" : "Mark ready"}
                    </button>
                  )}
                  {status === "READY" && (
                    <button type="button" className="staff-action-primary" disabled={isSaving}
                      onClick={() => void updateStatus(order, "DELIVERED")}>
                      {isSaving ? "Saving…" : "Mark delivered"}
                    </button>
                  )}
                  {["DELIVERED", "CANCELLED"].includes(status) && (
                    <span className="staff-order-closed">No further status actions available</span>
                  )}
                </div>

                {isRejecting && (
                  <form
                    className="staff-rejection-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!rejectionReason.trim()) {
                        setError("Please enter a reason before rejecting the order.");
                        return;
                      }
                      void updateStatus(order, "CANCELLED", rejectionReason);
                    }}
                  >
                    <label htmlFor={`rejection-reason-${order.orderId}`}>
                      Reason for rejecting this order <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id={`rejection-reason-${order.orderId}`}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Explain why this order cannot be accepted…"
                      required
                    />
                    <div className="staff-rejection-footer">
                      <span>{rejectionReason.length}/1000</span>
                      <div>
                        <button type="button" className="staff-action-secondary"
                          disabled={isSaving}
                          onClick={() => { setRejectingId(null); setRejectionReason(""); setError(""); }}>
                          Keep order
                        </button>
                        <button type="submit" className="staff-action-danger"
                          disabled={isSaving || !rejectionReason.trim()}>
                          {isSaving ? "Rejecting…" : "Submit rejection"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}