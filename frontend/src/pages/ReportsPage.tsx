import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type Report = {
  onlineSales: number;
  inStoreSales: number;
  totalSales: number;
  onlineDiscount: number;
  inStoreDiscount: number;
  totalDiscount: number;
  onlineTransactionCount: number;
  inStoreTransactionCount: number;
  transactionCount: number;
};

type Period = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

const periods: { value: Exclude<Period, "CUSTOM">; label: string }[] = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This week" },
  { value: "THIS_MONTH", label: "This month" },
];

function money(value?: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(body: unknown) {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Unable to load the sales report. Please try again.";
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("TODAY");
  const [startDate, setStartDate] = useState(() => localDate(new Date()));
  const [endDate, setEndDate] = useState(() => localDate(new Date()));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("latelier_token");
      const query = new URLSearchParams();
      if (period === "CUSTOM") {
        if (!startDate || !endDate) throw new Error("Select both a start date and an end date.");
        if (startDate > endDate) throw new Error("The start date must be on or before the end date.");
        query.set("start", `${startDate}T00:00:00`);
        // Exclusive end boundary: include the entire selected end date.
        const end = new Date(`${endDate}T00:00:00`);
        end.setDate(end.getDate() + 1);
        const endLocal = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
        query.set("end", `${endLocal}T00:00:00`);
      } else {
        query.set("period", period);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/sales?${query.toString()}`, {
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getErrorMessage(body));
      setReport(body as Report);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Unable to load the sales report.");
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const metrics = report ? [
    { label: "Total sales", value: money(report.totalSales), detail: "Online + in-store sales", className: "reports-metric-primary" },
    { label: "Transactions", value: Number(report.transactionCount ?? 0).toLocaleString("en-IN"), detail: "Delivered online orders + in-store sales" },
    { label: "Total discounts", value: money(report.totalDiscount), detail: "Recorded discounts across both channels" },
    { label: "Online sales", value: money(report.onlineSales), detail: `${Number(report.onlineTransactionCount ?? 0).toLocaleString("en-IN")} transactions` },
    { label: "In-store sales", value: money(report.inStoreSales), detail: `${Number(report.inStoreTransactionCount ?? 0).toLocaleString("en-IN")} transactions` },
    { label: "Online discounts", value: money(report.onlineDiscount), detail: "Delivered online orders" },
    { label: "In-store discounts", value: money(report.inStoreDiscount), detail: "Recorded in-store sales" },
  ] : [];

  return (
    <main className="uz-reports-page">
      <header className="uz-reports-header">
        <div>
          <p className="uz-reports-eyebrow">BUSINESS OVERVIEW</p>
          <h1>Sales reports</h1>
          <p className="uz-reports-subtitle">Review online and in-store sales using records from your database.</p>
        </div>
        <button className="uz-reports-refresh" onClick={() => void loadReport()} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh report"}
        </button>
      </header>

      <section className="uz-reports-filter" aria-label="Report date filters">
        <div className="uz-reports-periods">
          {periods.map((item) => (
            <button key={item.value} className={period === item.value ? "active" : ""} onClick={() => setPeriod(item.value)}>
              {item.label}
            </button>
          ))}
          <button className={period === "CUSTOM" ? "active" : ""} onClick={() => setPeriod("CUSTOM")}>Custom range</button>
        </div>
        {period === "CUSTOM" && (
          <div className="uz-reports-custom-range">
            <label>From <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label>To <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
            <button onClick={() => void loadReport()} disabled={loading}>Apply dates</button>
          </div>
        )}
      </section>

      {error && (
        <section className="uz-reports-error" role="alert">
          <strong>Report unavailable</strong><p>{error}</p>
          {error.includes("403") || error.toLowerCase().includes("forbidden") ? <p>Sales reports are restricted to an ADMIN account in the current backend security configuration.</p> : null}
          <button onClick={() => void loadReport()}>Try again</button>
        </section>
      )}

      {loading && !report ? <div className="uz-reports-state">Loading sales data…</div> : null}
      {!loading && !error && report && (
        <>
          <section className="uz-reports-metrics" aria-label="Sales summary">
            {metrics.map((metric) => (
              <article className={`uz-reports-metric ${metric.className ?? ""}`} key={metric.label}>
                <p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span>
              </article>
            ))}
          </section>
          <section className="uz-reports-breakdown">
            <div className="uz-reports-section-heading"><div><h2>Sales by channel</h2><p>Comparison for the selected reporting period</p></div></div>
            <div className="uz-reports-channel-list">
              <div className="uz-reports-channel-row">
                <div className="uz-reports-channel-label"><span className="uz-reports-dot online" />Online orders</div>
                <strong>{money(report.onlineSales)}</strong>
                <div className="uz-reports-bar-track"><span style={{ width: `${report.totalSales > 0 ? Math.min(100, (report.onlineSales / report.totalSales) * 100) : 0}%` }} /></div>
                <small>{report.totalSales > 0 ? `${((report.onlineSales / report.totalSales) * 100).toFixed(1)}% of sales` : "0% of sales"}</small>
              </div>
              <div className="uz-reports-channel-row">
                <div className="uz-reports-channel-label"><span className="uz-reports-dot instore" />In-store sales</div>
                <strong>{money(report.inStoreSales)}</strong>
                <div className="uz-reports-bar-track"><span style={{ width: `${report.totalSales > 0 ? Math.min(100, (report.inStoreSales / report.totalSales) * 100) : 0}%` }} /></div>
                <small>{report.totalSales > 0 ? `${((report.inStoreSales / report.totalSales) * 100).toFixed(1)}% of sales` : "0% of sales"}</small>
              </div>
            </div>
          </section>
          <p className="uz-reports-footnote">Online sales include orders marked DELIVERED by the backend. Totals and discounts are returned by the existing sales-report API.</p>
        </>
      )}
    </main>
  );
}
