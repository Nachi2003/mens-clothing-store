import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getLoggedInUser } from "../services/authService";

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
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

function OrderHistoryPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getLoggedInUser();

  useEffect(() => {
    const loadOrders = async () => {
      const loggedInUser = getLoggedInUser();

      if (!loggedInUser) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * 1. Load customer's orders
         */
        const ordersResponse = await fetch(
          `${API_BASE_URL}/api/customers/${loggedInUser.userId}/orders`
        );

        if (!ordersResponse.ok) {
          throw new Error("Unable to load your orders.");
        }

        const ordersData: Order[] =
          await ordersResponse.json();

        /*
         * 2. Load items for every order
         */
        const ordersWithItems: OrderWithItems[] =
          await Promise.all(
            ordersData.map(async (order) => {
              try {
                const itemsResponse = await fetch(
                  `${API_BASE_URL}/api/customers/orders/${order.orderId}/items`
                );

                if (!itemsResponse.ok) {
                  return {
                    ...order,
                    items: [],
                  };
                }

                const items: OrderItem[] =
                  await itemsResponse.json();

                return {
                  ...order,
                  items,
                };
              } catch (itemError) {
                console.error(
                  `Failed to load items for ${order.orderNumber}:`,
                  itemError
                );

                return {
                  ...order,
                  items: [],
                };
              }
            })
          );

        setOrders(ordersWithItems);
      } catch (err) {
        console.error("Failed to load orders:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate]);

  /*
   * Format order date
   */
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
   * Order tracking steps
   */
  const trackingSteps = [
    "PLACED",
    "CONFIRMED",
    "READY",
    "DELIVERED",
  ];

  const getStatusIndex = (status: string) => {
    const index = trackingSteps.indexOf(
      status.toUpperCase()
    );

    return index >= 0 ? index : 0;
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-loading">
            <span>ACCOUNT</span>
            <h1>MY ORDERS</h1>
            <p>Loading your L’ATELIER orders...</p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <main className="orders-page">
        <div className="orders-container">

          <div className="orders-header">
            <span>ACCOUNT</span>
            <h1>MY ORDERS</h1>
          </div>

          <div className="orders-error">
            <h2>Something went wrong</h2>

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
    <main className="orders-page">
      <div className="orders-container">

        {/* =================================================
            CUSTOMER HEADER
            ================================================= */}

        <div className="orders-header">

          <span>ACCOUNT</span>

          <h1>MY ORDERS</h1>

          {user && (
            <div className="orders-customer">

              <div className="orders-avatar">
                {user.name
                  ? user.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>
                <strong>
                  Welcome back, {user.name}
                </strong>

                <p>
                  {user.email}
                </p>
              </div>

            </div>
          )}

          <p className="orders-intro">
            View your L’ATELIER order history and
            track your purchases.
          </p>

        </div>

        {/* =================================================
            EMPTY ORDERS
            ================================================= */}

        {orders.length === 0 ? (
          <div className="orders-empty">

            <span>YOUR ACCOUNT</span>

            <h2>No orders yet</h2>

            <p>
              You haven't placed an order with
              L’ATELIER yet.
            </p>

            <Link to="/shop">
              START SHOPPING
            </Link>

          </div>
        ) : (

          /* =================================================
             ORDERS
             ================================================= */

          <div className="orders-list">

            {orders.map((order) => {

              const currentStatusIndex =
                getStatusIndex(order.status);

              return (
                <article
                  className="order-card"
                  key={order.orderId}
                >

                  {/* -----------------------------------------
                      ORDER HEADER
                      ----------------------------------------- */}

                  <div className="order-card-top">

                    <div>
                      <span className="order-label">
                        ORDER
                      </span>

                      <h2>
                        {order.orderNumber}
                      </h2>

                      <p className="order-date">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`order-status order-status-${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>

                  </div>

                  {/* -----------------------------------------
                      TRACKING
                      ----------------------------------------- */}

                  <div className="order-tracking">

                    <div className="tracking-title">
                      ORDER STATUS
                    </div>

                    <div className="tracking-steps">

                      {trackingSteps.map(
                        (step, index) => {

                          const completed =
                            index <= currentStatusIndex;

                          const active =
                            index === currentStatusIndex;

                          return (
                            <div
                              className={`tracking-step ${
                                completed
                                  ? "is-completed"
                                  : ""
                              } ${
                                active
                                  ? "is-active"
                                  : ""
                              }`}
                              key={step}
                            >

                              <div className="tracking-dot">
                                {completed
                                  ? "✓"
                                  : index + 1}
                              </div>

                              <span>
                                {step}
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>

                  {/* -----------------------------------------
                      ORDER ITEMS
                      ----------------------------------------- */}

                  <div className="order-items-section">

                    <div className="order-section-label">
                      ORDER ITEMS
                    </div>

                    {order.items.length === 0 ? (
                      <p className="order-items-loading">
                        Order items unavailable.
                      </p>
                    ) : (
                      <div className="order-items">

                        {order.items.map((item) => (
                          <div
                            className="order-item"
                            key={item.orderItemId}
                          >

                            <div className="order-item-image">
                              L’ATELIER
                            </div>

                            <div className="order-item-info">

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

                            <div className="order-item-price">

                              ₹
                              {Number(
                                item.subtotal
                              ).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}

                            </div>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>

                  {/* -----------------------------------------
                      DELIVERY INFORMATION
                      ----------------------------------------- */}

                  <div className="order-delivery">

                    <div className="order-section-label">
                      DELIVERY DETAILS
                    </div>

                    <div className="order-delivery-grid">

                      <div>
                        <span>DELIVER TO</span>

                        <strong>
                          {user?.name || "Customer"}
                        </strong>
                      </div>

                      <div>
                        <span>PHONE</span>

                        <strong>
                          {order.phone}
                        </strong>
                      </div>

                      <div className="order-address-box">
                        <span>ADDRESS</span>

                        <p>
                          {order.address}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* -----------------------------------------
                      PRICE SUMMARY
                      ----------------------------------------- */}

                  <div className="order-summary">

                    <div className="order-summary-row">
                      <span>Subtotal</span>

                      <span>
                        ₹
                        {Number(
                          order.totalAmount
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>

                    <div className="order-summary-row">
                      <span>Delivery</span>

                      <span>Free</span>
                    </div>

                    <div className="order-summary-total">
                      <span>TOTAL</span>

                      <strong>
                        ₹
                        {Number(
                          order.totalAmount
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* -----------------------------------------
                      ACTION
                      ----------------------------------------- */}

                  <div className="order-card-footer">

                    <Link
                      to={`/orders/${order.orderId}`}
                    >
                      VIEW ORDER DETAILS →
                    </Link>

                  </div>

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