import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function DashboardCards({ productsCount, suppliersCount, ordersCount, revenue }) {
  useLocale();

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
        <strong>{money(revenue)}</strong>
        <span>{t("totalPipeline")}</span>
      </div>
    </section>
  );
}
