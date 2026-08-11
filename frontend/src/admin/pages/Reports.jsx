import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Reports() {
  useLocale();
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
        setError(err.message || t("unableToLoadReports"));
      });
  }, [user?.token]);

  const formatCurrencyTotals = (totals = {}) => {
    const rows = Object.entries(totals || {});
    // USD is the platform's chosen settlement/reporting currency.
    return rows.length ? rows.map(([currency, amount]) => money(amount, currency)).join(" · ") : money(0, "USD");
  };

  const stats = report ? [
    [t("grossProfit"), formatCurrencyTotals(report.gross_profit_by_currency)],
    [t("revenue"), formatCurrencyTotals(report.revenue_by_currency)],
    [t("pendingRevenue"), formatCurrencyTotals(report.pending_revenue_by_currency)],
    [t("orders"), report.total_orders],
    [t("paidOrders"), report.paid_orders],
    [t("supplierDispatched"), report.supplier_dispatched_orders],
    [t("payoutPending"), formatCurrencyTotals(report.supplier_payout_pending)],
    [t("payoutPaid"), formatCurrencyTotals(report.supplier_payout_paid)],
    [t("payoutHeld"), formatCurrencyTotals(report.supplier_payout_held)],
    [t("payoutCancelled"), formatCurrencyTotals(report.supplier_payout_cancelled)],
    [t("fulfillmentRate"), `${report.fulfillment_rate}%`],
    [t("connectedSuppliers"), report.connected_suppliers]
  ] : [];

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("reports")}</p>
          <h2>{t("businessReports")}</h2>
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
      ) : !error ? <div className="empty">{t("loadingReports")}</div> : null}
    </main>
  );
}
