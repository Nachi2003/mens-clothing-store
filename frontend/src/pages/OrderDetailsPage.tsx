import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getLoggedInUser, getAuthToken } from "../services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

interface Order {
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
}

interface OrderItem {
  orderItemId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalPrice: number;
  subtotal: number;
  imageUrl?: string;
}

interface ProductVariantLookup {
  variantId: number;
  productId: number;
  active?: boolean;
}

interface ProductImageLookup {
  imageId: number;
  imageUrl: string;
  primary: boolean;
  color?: string | null;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const TRACKING_STEPS = ["PLACED", "CONFIRMED", "READY", "DELIVERED"];

function getFullImageUrl(imageUrl: string) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_BASE_URL.replace(/\/+$/, "")}/${imageUrl.replace(/^\/+/, "")}`;
}

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(status: string) {
  return (status || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function getStatusIndex(status: string) {
  const normalized = normalizeStatus(status);
  const aliases: Record<string, string> = {
    ORDER_PLACED: "PLACED",
    PROCESSING: "CONFIRMED",
    PREPARING: "CONFIRMED",
    READY_FOR_PICKUP: "READY",
    OUT_FOR_DELIVERY: "READY",
    SHIPPED: "READY",
    COMPLETED: "DELIVERED",
  };
  return TRACKING_STEPS.indexOf(aliases[normalized] || normalized);
}

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const user = getLoggedInUser();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState("");

  async function acknowledgeRejection() {
    const loggedInUser = getLoggedInUser();
    const token = getAuthToken();
    if (!loggedInUser || !token || !order) {
      navigate("/login");
      return;
    }

    try {
      setAcknowledging(true);
      setAcknowledgementError("");
      const response = await fetch(
        `${API_BASE_URL}/api/customers/${loggedInUser.userId}/orders/${order.orderId}/acknowledge-rejection`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || "Unable to acknowledge this message.");
      }
      setOrder((current) =>
        current
          ? {
              ...current,
              declineReason: result.declineReason ?? current.declineReason,
              customerAcknowledgedRejection: Boolean(result.customerAcknowledgedRejection),
              customerAcknowledgedAt: result.customerAcknowledgedAt ?? null,
            }
          : current
      );
    } catch (ackError) {
      setAcknowledgementError(
        ackError instanceof Error ? ackError.message : "Unable to acknowledge this message."
      );
    } finally {
      setAcknowledging(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      const loggedInUser = getLoggedInUser();
      const token = getAuthToken();

      if (!loggedInUser || !token) {
        navigate("/login");
        return;
      }

      const requestedOrderId = Number(orderId);
      if (!orderId || !Number.isInteger(requestedOrderId) || requestedOrderId <= 0) {
        setError("Invalid order number.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Use the existing customer orders endpoint and select the requested order.
        const ordersResponse = await fetch(
          `${API_BASE_URL}/api/customers/${loggedInUser.userId}/orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!ordersResponse.ok) {
          if (ordersResponse.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          if (ordersResponse.status === 403) {
            throw new Error("You don't have permission to access these orders.");
          }
          throw new Error("Unable to load your orders.");
        }

        const orders: Order[] = await ordersResponse.json();
        const selectedOrder = orders.find(
          (candidate) => Number(candidate.orderId) === requestedOrderId
        );

        if (!selectedOrder) {
          throw new Error("We couldn't find this order in your account.");
        }

        const itemsResponse = await fetch(
          `${API_BASE_URL}/api/customers/orders/${selectedOrder.orderId}/items`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!itemsResponse.ok) {
          throw new Error("Unable to load the items for this order.");
        }

        const items: OrderItem[] = await itemsResponse.json();

        // Reuse existing product variant and image endpoints used by ProductDetailsPage.
        const variantsResponse = await fetch(
          `${API_BASE_URL}/api/product-variants`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const variants: ProductVariantLookup[] = variantsResponse.ok
          ? await variantsResponse.json()
          : [];

        const variantsById = new Map(
          variants.map((variant) => [Number(variant.variantId), variant])
        );

        const productIds = Array.from(
          new Set(
            items
              .map((item) => variantsById.get(Number(item.variantId))?.productId)
              .filter((id): id is number => Number.isFinite(id) && Number(id) > 0)
              .map(Number)
          )
        );

        const imagesByProductId = new Map<number, ProductImageLookup[]>();
        await Promise.all(
          productIds.map(async (productId) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/products/${productId}/images`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.ok) {
                const images: ProductImageLookup[] = await response.json();
                imagesByProductId.set(productId, images);
              }
            } catch (imageError) {
              console.error(`Unable to load product ${productId} images:`, imageError);
            }
          })
        );

        const itemsWithImages = items.map((item) => {
          const productId = variantsById.get(Number(item.variantId))?.productId;
          const productImages = productId
            ? imagesByProductId.get(Number(productId)) ?? []
            : [];

          // Prefer an image explicitly assigned to the purchased color, then primary, then first.
          const matchingColorImage = productImages.find(
            (image) =>
              image.color?.trim().toLowerCase() === item.color?.trim().toLowerCase()
          );
          const selectedImage =
            matchingColorImage ??
            productImages.find((image) => image.primary) ??
            productImages[0];

          return {
            ...item,
            imageUrl: selectedImage?.imageUrl
              ? getFullImageUrl(selectedImage.imageUrl)
              : undefined,
          };
        });

        if (!cancelled) {
          setOrder({ ...selectedOrder, items: itemsWithImages });
        }
      } catch (loadError) {
        console.error("Failed to load order details:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load order details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [navigate, orderId]);

  if (loading) {
    return (
      <main className="orders-page order-details-page">
        <div className="orders-container">
          <section className="od-state">
            <span className="od-eyebrow">YOUR ACCOUNT</span>
            <h1>Order Details</h1>
            <p>Loading your order…</p>
          </section>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="orders-page order-details-page">
        <div className="orders-container">
          <section className="od-state od-error" role="alert">
            <span className="od-eyebrow">YOUR ACCOUNT</span>
            <h1>Order Details</h1>
            <h2>We couldn't open this order</h2>
            <p>{error || "Order details are unavailable."}</p>
            <div className="od-detail-actions">
              <Link to="/orders" className="od-primary-action">Back to My Orders</Link>
              <Link to="/shop" className="od-secondary-action">Continue shopping</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const status = normalizeStatus(order.status);
  const isCancelled = status === "CANCELLED";
  const statusIndex = getStatusIndex(status);

  return (
    <main className="orders-page order-details-page">
      <div className="orders-container">
        <div className="od-detail-topbar">
          <Link to="/orders" className="od-back-link" aria-label="Back to My Orders">
            <span aria-hidden="true">←</span> My Orders
          </Link>
          <span className={`od-status-pill ${isCancelled ? "is-cancelled" : ""}`}>
            {status.replace(/_/g, " ")}
          </span>
        </div>

        <article className="od-order-card">
          <header className="od-order-header">
            <div>
              <span className="od-muted-label">ORDER</span>
              <h1>{order.orderNumber}</h1>
              <p>Placed on {formatDate(order.createdAt)}</p>
            </div>
          </header>

          <section className="od-tracking-section">
            <h2 className="od-section-title">Order status</h2>
            {isCancelled ? (
              <div className="od-cancelled-message">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>Order cancelled</strong>
                  <p>This order is no longer progressing through delivery.</p>
                </div>
              </div>
            ) : (
              <div className="od-tracking-steps" aria-label={`Order status: ${status}`}>
                {TRACKING_STEPS.map((step, index) => {
                  const completed = statusIndex >= 0 && index <= statusIndex;
                  const active = index === statusIndex;
                  return (
                    <div
                      className={[
                        "od-tracking-step",
                        completed ? "is-completed" : "",
                        active ? "is-active" : "",
                      ].filter(Boolean).join(" ")}
                      key={step}
                    >
                      <div className="od-step-line" aria-hidden="true" />
                      <span className="od-step-dot">{completed ? "✓" : index + 1}</span>
                      <span className="od-step-label">
                        {step.charAt(0) + step.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {order.declineReason && (
              <div className="od-rejection-notice" role="status">
                <div>
                  <strong>Message from staff about this order</strong>
                  <p>{order.declineReason}</p>
                  {order.customerAcknowledgedRejection ? (
                    <span className="od-acknowledged-label">You acknowledged this message</span>
                  ) : (
                    <button
                      type="button"
                      className="od-acknowledge-button"
                      disabled={acknowledging}
                      onClick={acknowledgeRejection}
                    >
                      {acknowledging ? "Saving..." : "I Understand"}
                    </button>
                  )}
                  {acknowledgementError && (
                    <p className="od-acknowledgement-error" role="alert">
                      {acknowledgementError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="od-items-section">
            <h2 className="od-section-title">Order items</h2>
            {order.items.length === 0 ? (
              <p className="od-items-unavailable">Item details are unavailable for this order.</p>
            ) : (
              <div className="od-items-list">
                {order.items.map((item) => (
                  <div className="od-item" key={item.orderItemId}>
                    <div className="od-item-image">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span aria-hidden="true">UZ</span>
                      )}
                    </div>
                    <div className="od-item-info">
                      <h3>{item.productName}</h3>
                      <p>{item.color} / {item.size}</p>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <strong className="od-item-price">
                      {formatCurrency(item.subtotal ?? Number(item.finalPrice ?? item.unitPrice) * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="od-delivery-section">
            <h2 className="od-section-title">Delivery details</h2>
            <div className="od-delivery-grid">
              <div>
                <span className="od-muted-label">Deliver to</span>
                <strong>{user?.name || "Customer"}</strong>
              </div>
              <div>
                <span className="od-muted-label">Phone</span>
                <strong>{order.phone || "Not provided"}</strong>
              </div>
              <div className="od-address">
                <span className="od-muted-label">Delivery address</span>
                <p>{order.address || "Address unavailable"}</p>
              </div>
            </div>
          </section>

          <section className="od-total-section">
            <div className="od-total-row">
              <span>Delivery</span>
              <strong>Free</strong>
            </div>
            <div className="od-total-row od-grand-total">
              <span>Total amount</span>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
          </section>

          <footer className="od-detail-actions">
            <Link to="/orders" className="od-primary-action">Back to My Orders</Link>
            <Link to="/shop" className="od-secondary-action">Continue shopping</Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
