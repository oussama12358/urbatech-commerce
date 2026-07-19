import { useMemo, useState } from "react";
import DashboardCards from "../components/DashboardCards.jsx";
import ProductTable from "../components/ProductTable.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Dashboard() {
  useLocale();
  const { products, orders, categories, suppliers } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const statuses = useMemo(() => ["All", ...new Set(products.map((product) => product.status).filter(Boolean))], [products]);

  const translateStatus = (status) => {
    if (status === "All") return t("allStatuses");
    if (status === "In stock") return t("inStockStatus");
    if (status === "Low stock") return t("lowStockStatus");
    if (status === "Out of stock") return t("outOfStockStatus");
    if (status === "Preorder") return t("preorderStatus");
    return status;
  };

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q || [product.name, product.category, product.status].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "All" || product.category === category;
      const matchesStatus = status === "All" || product.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, products, query, status]);

  return (
    <main className="admin-main">
      <DashboardCards productsCount={products.length} suppliersCount={suppliers.length} ordersCount={orders.length} revenue={revenue} />
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="admin-section-head">
          <h2>{t("recentProducts")}</h2>
          <span>{filteredProducts.length} {t("matching")}</span>
        </div>
        <div className="admin-filter-bar">
          <input className="input" type="search" placeholder={t("searchProductsPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">{t("allCategories")}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>{translateStatus(item)}</option>
            ))}
          </select>
        </div>
        <ProductTable products={filteredProducts.slice(0, 6)} />
      </section>
    </main>
  );
}
