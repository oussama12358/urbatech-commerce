import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";

export default function Reports() {
  const { user } = useStore();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    api("/admin/reports")
      .then((json) => {
        setError("");
        setReport(json.data);
      })
      .catch((err) => {
        setReport(null);
        setError(err.message || "Unable to load reports");
      });
  }, [user?.token]);

  const stats = report ? [
    ["Revenue", money(report.revenue)],
    ["Pending revenue", money(report.pending_revenue)],
    ["Orders", report.total_orders],
    ["Paid orders", report.paid_orders],
    ["Supplier dispatched", report.supplier_dispatched_orders],
    ["Payout pending", money(report.supplier_payout_pending || 0)],
    ["Payout paid", money(report.supplier_payout_paid || 0)],
    ["Payout held", money(report.supplier_payout_held || 0)],
    ["Payout cancelled", money(report.supplier_payout_cancelled || 0)],
    ["Fulfillment rate", `${report.fulfillment_rate}%`],
    ["Active products", report.active_products],
    ["Connected suppliers", report.connected_suppliers]
  ] : [];

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Business reports</h2>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {report ? (
        <section className="report-grid">
          {stats.map(([label, value]) => (
            <div className="stat" key={label}>
              <BarChart3 />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>
      ) : !error ? <div className="empty">Loading reports...</div> : null}
    </main>
  );
}
