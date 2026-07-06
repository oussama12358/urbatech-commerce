import { money } from "../../shared/lib/format.js";

export default function DashboardCards({ productsCount, suppliersCount, ordersCount, revenue }) {
  return (
    <section className="dashboard-stats stats">
      <div className="stat">
        <strong>{productsCount}</strong>
        <span>Products</span>
      </div>
      <div className="stat">
        <strong>{suppliersCount}</strong>
        <span>Suppliers</span>
      </div>
      <div className="stat">
        <strong>{ordersCount}</strong>
        <span>Orders</span>
      </div>
      <div className="stat">
        <strong>{money(revenue)}</strong>
        <span>Total pipeline</span>
      </div>
    </section>
  );
}
