import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { getAuthToken, getLoggedInUser } from "../services/authService";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type DashboardRange = "today" | "7d" | "30d" | "custom";

type SalesItem = {
    transactionType?: string | null;
    transactionNumber?: string | null;
    invoiceNumber?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    totalAmount?: number | string | null;
    totalDiscount?: number | string | null;
    paymentMethod?: string | null;
    createdAt?: string | null;
};

type LowStockItem = {
    variantId?: number | null;
    productName?: string | null;
    size?: string | null;
    color?: string | null;
    quantity?: number | null;
    lowStockThreshold?: number | null;
};

type OutOfStockItem = {
    variantId?: number | null;
    productName?: string | null;
    size?: string | null;
    color?: string | null;
    quantity?: number | null;
};

type AdminOrder = {
    orderId?: number | null;
    orderNumber?: string | null;
    status?: string | null;
    paymentStatus?: string | null;
    totalAmount?: number | string | null;
    createdAt?: string | null;
};

type DashboardData = {
    sales: SalesItem[];
    previousSales: SalesItem[];
    lowStock: LowStockItem[];
    outOfStock: OutOfStockItem[];
    orders: AdminOrder[];
};

type RangeSelection = {
    start: Date;
    end: Date;
    label: string;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
});

function formatMoney(value: number | string | null | undefined): string {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatCompactMoney(value: number | string | null | undefined): string {
    return compactCurrencyFormatter.format(Number(value ?? 0));
}

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toApiDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function addDays(date: Date, value: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + value);
    return copy;
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getRangeSelection(
    range: DashboardRange,
    customStart: string,
    customEnd: string
): RangeSelection {
    const today = new Date();
    const now = new Date(today);

    if (range === "today") {
        const start = startOfDay(now);
        return {
            start,
            end: addDays(start, 1),
            label: "Today",
        };
    }

    if (range === "7d") {
        const start = addDays(startOfDay(now), -6);
        return {
            start,
            end: addDays(startOfDay(now), 1),
            label: "Last 7 days",
        };
    }

    if (range === "30d") {
        const start = addDays(startOfDay(now), -29);
        return {
            start,
            end: addDays(startOfDay(now), 1),
            label: "Last 30 days",
        };
    }

    if (!customStart || !customEnd) {
        throw new Error("Select both a start and end date.");
    }

    const start = new Date(`${customStart}T00:00:00`);
    const end = new Date(`${customEnd}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("The custom date range is invalid.");
    }

    if (start > end) {
        throw new Error("Start date must be before the end date.");
    }

    return {
        start,
        end: new Date(end.getTime() + 1000),
        label: "Custom range",
    };
}

function getPreviousRange(currentStart: Date, currentEnd: Date): RangeSelection {
    const elapsedMs = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - elapsedMs);
    const previousEnd = new Date(currentStart.getTime());

    return {
        start: previousStart,
        end: previousEnd,
        label: "Previous period",
    };
}
/*
function getErrorMessage(body: unknown): string {
    if (body && typeof body === "object" && "message" in body) {
        const message = (body as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) {
            return message;
        }
    }
    return "Unable to load admin dashboard data.";
}
*/
async function fetchJson<T>(endpoint: string): Promise<T> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const text = await response.text();
    if (!response.ok) {
        let message = response.statusText || "Request failed";
        if (text) {
            try {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
                    message = parsed.message;
                }
            } catch {
                message = text;
            }
        }
        throw new Error(message);
    }

    if (!text) {
        return [] as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return [] as T;
    }
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
/*
function formatShortDate(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}
*/
function getPaymentBadgeClass(value: string | null | undefined): string {
    const normalized = (value || "").toUpperCase();
    if (normalized.includes("UPI") || normalized.includes("CARD")) return "paid";
    if (normalized.includes("CASH")) return "cash";
    return "neutral";
}

function getStatusBadgeClass(value: string | null | undefined): string {
    const normalized = (value || "").toUpperCase();
    if (normalized === "DELIVERED" || normalized === "PAID") return "paid";
    if (normalized === "PENDING") return "warning";
    if (normalized === "CANCELLED" || normalized === "REJECTED") return "danger";
    return "neutral";
}
/*
function getTransactionBadgeClass(value: string | null | undefined): string {
    const normalized = (value || "").toUpperCase();
    if (normalized === "IN_STORE") return "instore";
    if (normalized === "ONLINE") return "online";
    return "neutral";
}
*/
function getSimpleTrendLabel(current: number, previous: number): string {
    if (previous === 0) {
        return current > 0 ? "No prior comparison" : "No sales in prior period";
    }

    const delta = current - previous;
    const percentage = (Math.abs(delta) / previous) * 100;

    if (delta === 0) return "On par with previous period";
    return `${delta > 0 ? "Up" : "Down"} ${formatCompactMoney(Math.abs(delta))} (${percentage.toFixed(1)}%) vs previous period`;
}

export default function AdminDashboardPage() {
    const user = getLoggedInUser();
    const [range, setRange] = useState<DashboardRange>("today");
    const [customStart, setCustomStart] = useState(() => formatDateInput(new Date()));
    const [customEnd, setCustomEnd] = useState(() => formatDateInput(new Date()));
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [dashboard, setDashboard] = useState<DashboardData>({
        sales: [],
        previousSales: [],
        lowStock: [],
        outOfStock: [],
        orders: [],
    });

    const currentRange = useMemo(
        () => getRangeSelection(range, customStart, customEnd),
        [range, customStart, customEnd]
    );

    const previousRange = useMemo(
        () => getPreviousRange(currentRange.start, currentRange.end),
        [currentRange]
    );

    const loadDashboard = useCallback(
        async (quiet = false) => {
            try {
                if (quiet) setRefreshing(true);
                else setLoading(true);

                setError("");

                const currentStart = toApiDateTime(currentRange.start);
                const currentEnd = toApiDateTime(currentRange.end);
                const prevStart = toApiDateTime(previousRange.start);
                const prevEnd = toApiDateTime(previousRange.end);

                const [currentSales, previousSales, lowStock, outOfStock, orders] =
                    await Promise.all([
                        fetchJson<SalesItem[]>(
                            `/api/admin/reports/sales-history?start=${encodeURIComponent(currentStart)}&end=${encodeURIComponent(currentEnd)}`
                        ),
                        fetchJson<SalesItem[]>(
                            `/api/admin/reports/sales-history?start=${encodeURIComponent(prevStart)}&end=${encodeURIComponent(prevEnd)}`
                        ),
                        fetchJson<LowStockItem[]>("/api/inventory/low-stock"),
                        fetchJson<OutOfStockItem[]>("/api/inventory/out-of-stock"),
                        fetchJson<AdminOrder[]>("/api/customers/admin/orders"),
                    ]);

                setDashboard({
                    sales: Array.isArray(currentSales) ? currentSales : [],
                    previousSales: Array.isArray(previousSales) ? previousSales : [],
                    lowStock: Array.isArray(lowStock) ? lowStock : [],
                    outOfStock: Array.isArray(outOfStock) ? outOfStock : [],
                    orders: Array.isArray(orders) ? orders : [],
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dashboard data right now."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [currentRange, previousRange]
    );

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const todayLabel = useMemo(
        () =>
            new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            }).format(new Date()),
        []
    );

    const currentRevenue = useMemo(
        () =>
            dashboard.sales.reduce(
                (sum, item) => sum + Number(item.totalAmount ?? 0),
                0
            ),
        [dashboard.sales]
    );

    const previousRevenue = useMemo(
        () =>
            dashboard.previousSales.reduce(
                (sum, item) => sum + Number(item.totalAmount ?? 0),
                0
            ),
        [dashboard.previousSales]
    );

    const currentTransactions = dashboard.sales.length;
    const previousTransactions = dashboard.previousSales.length;
    const averageBill = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const previousAverageBill =
        previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

    const lowStockCount = dashboard.lowStock.length;
    const outOfStockCount = dashboard.outOfStock.length;

    const chartData = useMemo(() => {
        const map = new Map<string, number>();
        dashboard.sales.forEach((item) => {
            const createdAt = item.createdAt ? new Date(item.createdAt) : null;
            if (!createdAt || Number.isNaN(createdAt.getTime())) return;
            const key = formatDateInput(createdAt);
            const value = Number(item.totalAmount ?? 0);
            map.set(key, (map.get(key) ?? 0) + value);
        });

        const bucketStart = new Date(currentRange.start);
        const bucketEnd = new Date(currentRange.end);

        const result: { label: string; value: number; key: string }[] = [];

        for (let cursor = new Date(bucketStart); cursor < bucketEnd; cursor = addDays(cursor, 1)) {
            const key = formatDateInput(cursor);
            result.push({
                key,
                label: new Intl.DateTimeFormat("en-IN", {
                    month: "short",
                    day: "numeric",
                }).format(cursor),
                value: map.get(key) ?? 0,
            });
        }

        return result;
    }, [dashboard.sales, currentRange]);

    const chartMax = Math.max(...chartData.map((item) => item.value), 1);
    const chartPoints = chartData
        .map((point, index) => {
            const x =
                chartData.length === 1
                    ? 50
                    : (index / (chartData.length - 1)) * 520 + 20;
            const y = 170 - (point.value / chartMax) * 120;
            return `${x},${y}`;
        })
        .join(" ");

    const alerts = useMemo(() => {
        const items: {
            severity: "warning" | "danger" | "info";
            title: string;
            detail: string;
            link: string;
            meta: string;
        }[] = [];

        dashboard.lowStock.slice(0, 3).forEach((item) => {
            items.push({
                severity: "warning",
                title: `${item.productName || "Product"} is running low`,
                detail: `${item.size || "One size"} / ${item.color || "No color"} · ${item.quantity ?? 0} left`,
                link: "/staff-admin/products",
                meta: "Review inventory",
            });
        });

        dashboard.outOfStock.slice(0, 3).forEach((item) => {
            items.push({
                severity: "danger",
                title: `${item.productName || "Product"} is out of stock`,
                detail: `${item.size || "One size"} / ${item.color || "No color"} · 0 available`,
                link: "/staff-admin/products",
                meta: "Restock items",
            });
        });

        dashboard.orders
            .filter((order) => {
                const paymentStatus = (order.paymentStatus || "").toUpperCase();
                return paymentStatus !== "PAID" && paymentStatus !== "SETTLED";
            })
            .slice(0, 2)
            .forEach((order) => {
                items.push({
                    severity: "info",
                    title: `Order ${order.orderNumber || "#"} needs attention`,
                    detail: `${order.status || "Pending"} · ${formatMoney(order.totalAmount ?? 0)}`,
                    link: "/staff-admin/sales",
                    meta: "Check payment or fulfillment",
                });
            });

        return items;
    }, [dashboard]);

    const recentTransactions = useMemo(
        () => [...dashboard.sales].sort((a, b) => Number(new Date(b.createdAt ?? 0)) - Number(new Date(a.createdAt ?? 0))).slice(0, 6),
        [dashboard.sales]
    );

    const quickActions = [
        { label: "Add Product", to: "/staff-admin/products", tone: "primary" },
        { label: "Sales & Billing", to: "/staff-admin/sales", tone: "neutral" },
        { label: "Manage Inventory", to: "/staff-admin/products", tone: "neutral" },
        { label: "Manage Staff", to: "/staff-admin/team", tone: "neutral" },
        { label: "View Reports", to: "/staff-admin/reports", tone: "neutral" },
    ];

    const kpis = [
        {
            title: "Sales / Revenue",
            value: formatMoney(currentRevenue),
            helper: "Selected period total",
            comparison: getSimpleTrendLabel(currentRevenue, previousRevenue),
            icon: "₹",
            tone: "primary",
            link: "/staff-admin/reports",
        },
        {
            title: "Transactions / Bills",
            value: currentTransactions.toLocaleString("en-IN"),
            helper: "Completed sales in range",
            comparison:
                previousTransactions > 0
                    ? `${currentTransactions - previousTransactions >= 0 ? "Up" : "Down"} ${Math.abs(currentTransactions - previousTransactions).toLocaleString("en-IN")} vs previous period`
                    : "No prior comparison",
            icon: "◫",
            tone: "neutral",
            link: "/staff-admin/reports",
        },
        {
            title: "Average Bill Value",
            value: formatMoney(averageBill),
            helper: "Revenue ÷ transactions",
            comparison:
                previousAverageBill > 0
                    ? `${averageBill >= previousAverageBill ? "Up" : "Down"} ${formatMoney(Math.abs(averageBill - previousAverageBill))} vs previous period`
                    : "No prior comparison",
            icon: "◎",
            tone: "neutral",
            link: "/staff-admin/reports",
        },
        {
            title: "Low-Stock Products",
            value: lowStockCount.toLocaleString("en-IN"),
            helper: `${outOfStockCount} out of stock`,
            comparison:
                lowStockCount > 0 ? "Action recommended" : "No low-stock alerts",
            icon: "⚑",
            tone: "warning",
            link: "/staff-admin/products",
        },
    ];

    return (
        <section className="uz-admin-dashboard">
            <header className="uz-dashboard-header">
                <div className="uz-dashboard-heading">
                    <p className="uz-eyebrow">OPERATIONAL SNAPSHOT</p>
                    <h1>Welcome back, {user?.name || "Admin"}</h1>
                    <p className="uz-dashboard-subtitle">
                        {todayLabel} · {currentRange.label}
                    </p>
                </div>

                <div className="uz-dashboard-header-actions">
                    <div className="uz-range-filter" aria-label="Dashboard date range">
                        {[
                            { value: "today", label: "Today" },
                            { value: "7d", label: "7 Days" },
                            { value: "30d", label: "30 Days" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={range === option.value ? "active" : ""}
                                onClick={() => setRange(option.value as DashboardRange)}
                            >
                                {option.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={range === "custom" ? "active" : ""}
                            onClick={() => setRange("custom")}
                        >
                            Custom
                        </button>
                    </div>

                    <button
                        type="button"
                        className="uz-refresh-button"
                        onClick={() => void loadDashboard(true)}
                        disabled={loading || refreshing}
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <NavLink to="/staff-admin/products" className="uz-primary-action">
                        + Add Product
                    </NavLink>
                </div>
            </header>

            {range === "custom" && (
                <div className="uz-custom-range" aria-label="Custom dashboard range">
                    <label>
                        <span>From</span>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(event) => setCustomStart(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>To</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(event) => setCustomEnd(event.target.value)}
                        />
                    </label>

                    <button type="button" onClick={() => void loadDashboard(true)}>
                        Apply
                    </button>
                </div>
            )}

            {error && (
                <div className="uz-error-banner" role="alert">
                    <strong>Dashboard unavailable</strong>
                    <p>{error}</p>
                    <button type="button" onClick={() => void loadDashboard(true)}>
                        Retry
                    </button>
                </div>
            )}

            {loading && !error ? (
                <div className="uz-loading-state" aria-live="polite">
                    <div className="uz-skeleton-grid">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="uz-skeleton-card" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <section className="uz-kpi-grid" aria-label="Dashboard metrics">
                        {kpis.map((kpi) => (
                            <NavLink key={kpi.title} to={kpi.link} className={`uz-kpi-card ${kpi.tone}`}>
                                <div className="uz-kpi-header">
                                    <span className="uz-kpi-icon">{kpi.icon}</span>
                                    <span className="uz-kpi-label">{kpi.title}</span>
                                </div>

                                <div className="uz-kpi-value">{kpi.value}</div>

                                <div className="uz-kpi-meta">
                                    <span>{kpi.helper}</span>
                                    <strong>{kpi.comparison}</strong>
                                </div>
                            </NavLink>
                        ))}
                    </section>

                    <section className="uz-analytics-grid">
                        <article className="uz-panel uz-panel-sales">
                            <div className="uz-panel-header">
                                <div>
                                    <p className="uz-eyebrow">SALES TREND</p>
                                    <h2>Revenue overview</h2>
                                </div>

                                <NavLink to="/staff-admin/reports">View report</NavLink>
                            </div>

                            {chartData.length === 0 ? (
                                <div className="uz-empty-panel">
                                    No sales were recorded for the selected time range.
                                </div>
                            ) : (
                                <div className="uz-chart-wrap">
                                    <div className="uz-chart-grid">
                                        {[0, 1, 2, 3].map((line) => (
                                            <span key={line} />
                                        ))}
                                    </div>

                                    <svg viewBox="0 0 560 200" role="img" aria-label="Sales trend chart">
                                        <polyline
                                            fill="none"
                                            stroke="#a76c31"
                                            strokeWidth="4"
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            points={chartPoints}
                                        />
                                        {chartData.map((point, index) => {
                                            const x =
                                                chartData.length === 1
                                                    ? 280
                                                    : (index / (chartData.length - 1)) * 520 + 20;
                                            const y = 170 - (point.value / chartMax) * 120;

                                            return (
                                                <g key={point.key}>
                                                    <circle cx={x} cy={y} r="4" fill="#f0d6ad" />
                                                    <title>{`${point.label}: ${formatMoney(point.value)}`}</title>
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    <div className="uz-chart-labels">
                                        {chartData.map((point) => (
                                            <span key={point.key}>{point.label}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>

                        <article className="uz-panel uz-panel-alerts">
                            <div className="uz-panel-header">
                                <div>
                                    <p className="uz-eyebrow">ACTION CENTER</p>
                                    <h2>Needs Your Attention</h2>
                                </div>
                            </div>

                            {alerts.length === 0 ? (
                                <div className="uz-empty-panel">
                                    No action items right now. Inventory and payments are in good standing.
                                </div>
                            ) : (
                                <div className="uz-alert-list">
                                    {alerts.map((alert, index) => (
                                        <NavLink
                                            key={`${alert.title}-${index}`}
                                            to={alert.link}
                                            className={`uz-alert-item ${alert.severity}`}
                                        >
                                            <span className="uz-alert-dot" />
                                            <div>
                                                <strong>{alert.title}</strong>
                                                <p>{alert.detail}</p>
                                            </div>
                                            <small>{alert.meta}</small>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </article>
                    </section>

                    <section className="uz-lower-grid">
                        <article className="uz-panel">
                            <div className="uz-panel-header">
                                <div>
                                    <p className="uz-eyebrow">RECENT SALES</p>
                                    <h2>Transactions</h2>
                                </div>

                                <NavLink to="/staff-admin/reports">View all</NavLink>
                            </div>

                            <div className="uz-table-wrap">
                                {recentTransactions.length === 0 ? (
                                    <div className="uz-empty-panel">
                                        No transactions recorded for this period.
                                    </div>
                                ) : (
                                    <table>
                                        <thead>
                                        <tr>
                                            <th>Bill ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                            <th>Customer</th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {recentTransactions.map((item) => (
                                            <tr key={`${item.transactionType}-${item.transactionNumber}-${item.createdAt}`}>
                                                <td>
                            <span className="uz-transaction-id">
                              {item.invoiceNumber || item.transactionNumber || "—"}
                            </span>
                                                </td>
                                                <td>{formatDateTime(item.createdAt ?? "")}</td>
                                                <td>{formatMoney(item.totalAmount ?? 0)}</td>
                                                <td>
                            <span className={`uz-badge payment ${getPaymentBadgeClass(item.paymentMethod)}`}>
                              {item.paymentMethod || "—"}
                            </span>
                                                </td>
                                                <td>
                            <span className={`uz-badge status ${getStatusBadgeClass(item.transactionType)}`}>
                              {item.transactionType ? item.transactionType.replace("_", " ") : "Completed"}
                            </span>
                                                </td>
                                                <td>{item.customerName || "Walk-in"}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </article>

                        <article className="uz-panel">
                            <div className="uz-panel-header">
                                <div>
                                    <p className="uz-eyebrow">INVENTORY</p>
                                    <h2>Highlights</h2>
                                </div>

                                <NavLink to="/staff-admin/products">Open inventory</NavLink>
                            </div>

                            <div className="uz-inventory-spotlight">
                                <div className="uz-inventory-column">
                                    <h3>Low stock</h3>

                                    {dashboard.lowStock.length === 0 ? (
                                        <p className="uz-micro-copy">No low-stock items.</p>
                                    ) : (
                                        <ul>
                                            {dashboard.lowStock.slice(0, 5).map((item) => (
                                                <li key={item.variantId ?? item.productName}>
                                                    <span className="uz-product-thumb" style={{ background: item.color || "#d8c0a0" }} />
                                                    <div>
                                                        <strong>{item.productName || "Unknown product"}</strong>
                                                        <small>
                                                            {item.size || "One size"} · {item.color || "N/A"} · {item.quantity ?? 0} left
                                                        </small>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="uz-inventory-column">
                                    <h3>Out of stock</h3>

                                    {dashboard.outOfStock.length === 0 ? (
                                        <p className="uz-micro-copy">No out-of-stock items.</p>
                                    ) : (
                                        <ul>
                                            {dashboard.outOfStock.slice(0, 5).map((item) => (
                                                <li key={item.variantId ?? item.productName}>
                                                    <span className="uz-product-thumb" style={{ background: item.color || "#d8c0a0" }} />
                                                    <div>
                                                        <strong>{item.productName || "Unknown product"}</strong>
                                                        <small>
                                                            {item.size || "One size"} · {item.color || "N/A"} · 0 available
                                                        </small>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </article>
                    </section>

                    <section className="uz-quick-actions-panel uz-panel">
                        <div className="uz-panel-header">
                            <div>
                                <p className="uz-eyebrow">QUICK ACTIONS</p>
                                <h2>Priorities</h2>
                            </div>
                        </div>

                        <div className="uz-quick-actions">
                            {quickActions.map((action) => (
                                <NavLink
                                    key={action.label}
                                    to={action.to}
                                    className={`uz-action-card ${action.tone}`}
                                >
                                    {action.label}
                                </NavLink>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </section>
    );
}