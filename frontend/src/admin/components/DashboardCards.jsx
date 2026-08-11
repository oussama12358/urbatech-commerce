import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function DashboardCards({ productsCount, suppliersCount, ordersCount, revenueByCurrency = {} }) {
  useLocale();
  const revenueRows = Object.entries(revenueByCurrency);
  const revenue = revenueRows.length
    ? revenueRows.map(([currency, amount]) => money(amount, currency)).join(" · ")
    : money(0, "USD");

  return (
    <section className="dashboard-stats stats">
      <div className="stat">
        <strong>{productsCount}</strong>
        <span>{t("products")}</span>
      </div>
      <div className="stat">
        <strong>{suppliersCount}</strong>
        <span>{t("adminSuppliers")}</span>
      </div>
      <div className="stat">
        <strong>{ordersCount}</strong>
        <span>{t("orders")}</span>
      </div>
      <div className="stat">
        <strong>{revenue}</strong>
        <span>{t("totalPipeline")}</span>
      </div>
    </section>
  );
}
