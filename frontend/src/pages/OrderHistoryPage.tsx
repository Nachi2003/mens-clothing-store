import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

function getFullImageUrl(imageUrl: string) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `http://localhost:8080${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

const TRACKING_STEPS = ["PLACED", "CONFIRMED", "READY", "DELIVERED"];

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
  return status.trim().toUpperCase().replace(/[\s-]+/g, "_");
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

function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const user = getLoggedInUser();

  async function acknowledgeRejection(orderId: number) {
    const loggedInUser = getLoggedInUser();
    const token = getAuthToken();
    if (!loggedInUser || !token) {
      navigate("/login");
      return;
    }

    try {
      setAcknowledgingId(orderId);
      const response = await fetch(
        `${API_BASE_URL}/api/customers/${loggedInUser.userId}/orders/${orderId}/acknowledge-rejection`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || "Unable to acknowledge this message.");
      }
      setOrders((current) =>
        current.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                declineReason: result.declineReason ?? order.declineReason,
                customerAcknowledgedRejection: Boolean(result.customerAcknowledgedRejection),
                customerAcknowledgedAt: result.customerAcknowledgedAt ?? null,
              }
            : order
        )
      );
    } catch (ackError) {
      window.alert(ackError instanceof Error ? ackError.message : "Unable to acknowledge this message.");
    } finally {
      setAcknowledgingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      const loggedInUser = getLoggedInUser();
      const token = getAuthToken();

      if (!loggedInUser || !token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

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

        const ordersData: Order[] = await ordersResponse.json();

        // Reuse the same existing product-variant and product-image APIs
        // used by ProductDetailsPage; no new backend endpoints are required.
        let variantsById = new Map<number, ProductVariantLookup>();
        try {
          const variantsResponse = await fetch(
            `${API_BASE_URL}/api/product-variants`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (variantsResponse.ok) {
            const variants: ProductVariantLookup[] = await variantsResponse.json();
            variantsById = new Map(
              variants.map((variant) => [Number(variant.variantId), variant])
            );
          }
        } catch (variantError) {
          console.error("Unable to load product variants for order images:", variantError);
        }

        const imageByProductId = new Map<number, string>();
        // Product images are loaded after order items identify the purchased variants.

        const ordersWithItems: OrderWithItems[] = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const itemsResponse = await fetch(
                `${API_BASE_URL}/api/customers/orders/${order.orderId}/items`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (!itemsResponse.ok) {
                console.error(
                  `Unable to load items for ${order.orderNumber}. Status: ${itemsResponse.status}`
                );
                return { ...order, items: [] };
              }

              const items: OrderItem[] = await itemsResponse.json();
              return { ...order, items };
            } catch (itemError) {
              console.error(
                `Failed to load items for ${order.orderNumber}:`,
                itemError
              );
              return { ...order, items: [] };
            }
          })
        );

        const purchasedVariantIds = Array.from(
          new Set(
            ordersWithItems.flatMap((order) =>
              order.items.map((item) => Number(item.variantId))
            )
          )
        );

        const productIds = Array.from(
          new Set(
            purchasedVariantIds
              .map((variantId) => variantsById.get(variantId)?.productId)
              .filter((productId): productId is number => Number.isFinite(productId) && Number(productId) > 0)
              .map(Number)
          )
        );

        await Promise.all(
          productIds.map(async (productId) => {
            try {
              const imagesResponse = await fetch(
                `${API_BASE_URL}/api/products/${productId}/images`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (!imagesResponse.ok) return;

              const images: ProductImageLookup[] = await imagesResponse.json();
              const selectedImage =
                images.find((image) => image.primary) ?? images[0];

              if (selectedImage?.imageUrl) {
                imageByProductId.set(productId, getFullImageUrl(selectedImage.imageUrl));
              }
            } catch (imageError) {
              console.error(`Unable to load image for product ${productId}:`, imageError);
            }
          })
        );

        const ordersWithImages = ordersWithItems.map((order) => ({
          ...order,
          items: order.items.map((item) => {
            const productId = variantsById.get(Number(item.variantId))?.productId;
            return {
              ...item,
              imageUrl: productId ? imageByProductId.get(Number(productId)) : undefined,
            };
          }),
        }));

        if (!cancelled) setOrders(ordersWithImages);
      } catch (err) {
        console.error("Failed to load orders:", err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load your orders."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <main className="orders-page order-details-page">
        <div className="orders-container">
          <div className="od-state">
            <span className="od-eyebrow">YOUR ACCOUNT</span>
            <h1>Order Details</h1>
            <p>Loading your orders…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="orders-page order-details-page">
        <div className="orders-container">
          <div className="od-page-heading">
            <span className="od-eyebrow">YOUR ACCOUNT</span>
            <h1>Order Details</h1>
          </div>
          <section className="od-state od-error" role="alert">
            <h2>We couldn’t load your orders</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page order-details-page">
      <div className="orders-container">
        <header className="od-page-heading">
          <span className="od-eyebrow">YOUR ACCOUNT</span>
          <h1>Order Details</h1>
          <p>
            {user?.name ? `Hello, ${user.name}. ` : ""}
            Track your orders and review delivery information.
          </p>
        </header>

        {orders.length === 0 ? (
          <section className="od-state od-empty">
            <div className="od-empty-icon" aria-hidden="true">□</div>
            <h2>No orders yet</h2>
            <p>Your orders will appear here after you complete a purchase.</p>
            <Link to="/shop" className="od-primary-action">Start shopping</Link>
          </section>
        ) : (
          <div className="od-order-list">
            {orders.map((order) => {
              const status = normalizeStatus(order.status);
              const isCancelled = status === "CANCELLED";
              const statusIndex = getStatusIndex(status);

              return (
                <article className="od-order-card" key={order.orderId}>
                  <header className="od-order-header">
                    <div>
                      <span className="od-muted-label">ORDER</span>
                      <h2>{order.orderNumber}</h2>
                      <p>Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <span
                      className={`od-status-pill ${isCancelled ? "is-cancelled" : ""}`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                  </header>

                  <section className="od-tracking-section">
                    <h3 className="od-section-title">Order status</h3>

                    {isCancelled ? (
                      <div className="od-cancelled-message">
                        <span aria-hidden="true">!</span>
                        <div>
                          <strong>Order cancelled</strong>
                          <p>This order is no longer progressing through delivery.</p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="od-tracking-steps"
                        aria-label={`Order status: ${status.replace(/_/g, " ")}`}
                      >
                        {TRACKING_STEPS.map((step, index) => {
                          const completed =
                            statusIndex >= 0 && index <= statusIndex;
                          const active = statusIndex === index;

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
                              <span className="od-step-dot">
                                {completed ? "✓" : index + 1}
                              </span>
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
                              disabled={acknowledgingId === order.orderId}
                              onClick={() => acknowledgeRejection(order.orderId)}
                            >
                              {acknowledgingId === order.orderId ? "Saving..." : "I Understand"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="od-items-section">
                    <h3 className="od-section-title">Order items</h3>

                    {order.items.length === 0 ? (
                      <p className="od-items-unavailable">
                        Item details are temporarily unavailable.
                      </p>
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
                              <h4>{item.productName}</h4>
                              <p>{item.color} / {item.size}</p>
                              <p>Qty: {item.quantity}</p>
                            </div>
                            <strong className="od-item-price">
                              {formatCurrency(item.subtotal)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="od-delivery-section">
                    <h3 className="od-section-title">Delivery details</h3>
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

                  <footer className="od-card-footer">
                    <Link to={`/orders/${order.orderId}`} className="od-primary-action">
                      View order details <span aria-hidden="true">→</span>
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default OrderHistoryPage;
