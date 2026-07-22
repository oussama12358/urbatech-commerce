import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import ProductTable from "../components/ProductTable.jsx";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Products() {
  const locale = useLocale();
  const { products, categories, deleteProduct } = useStore();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState("All");
  const [status, setStatus] = useState("All");
  const [stock, setStock] = useState("All");
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
      const matchesQuery = !q || [
        product.name,
        product.category,
        product.status,
        product.lead,
        product.warranty,
        ...(product.specs || [])
      ].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "All" || product.category === category;
      const productSource = product.product_source || (product.supplier_id ? "api" : "internal");
      const matchesSource = source === "All" || productSource === source;
      const matchesStatus = status === "All" || product.status === status;
      const matchesStock =
        stock === "All" ||
        (stock === "Available" && product.stock > 0) ||
        (stock === "Low" && product.stock > 0 && product.stock <= 10) ||
        (stock === "Out" && product.stock === 0);
      return matchesQuery && matchesCategory && matchesSource && matchesStatus && matchesStock;
    });
  }, [category, products, query, source, status, stock]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteProduct(pendingDelete.id);
    setPendingDelete(null);
  };

  const productCountLabel = locale === "ar"
    ? `${t("products")} ${filteredProducts.length} ${t("of")} ${products.length}`
    : `${filteredProducts.length} ${t("of")} ${products.length} ${t("products")}`;

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("catalogue")}</p>
          <h2>{t("products")}</h2>
        </div>
        <Link className="primary-btn" to="/admin/products/new">
          <Plus />
          {t("addProduct")}
        </Link>
      </div>
      <section className="panel">
        <div className="admin-section-head">
          <h2>{t("catalogueList")}</h2>
          <span>{productCountLabel}</span>
        </div>
        <div className="admin-filter-bar">
          <input className="input" type="search" placeholder={t("searchProductsPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">{t("allCategories")}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
          <select className="select" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="All">{t("allSources")}</option>
            <option value="api">{t("sourceApi")}</option>
            <option value="import">{t("sourceImport")}</option>
            <option value="internal">{t("sourceInternal")}</option>
          </select>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>{translateStatus(item)}</option>
            ))}
          </select>
          <select className="select" value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="All">{t("allStock")}</option>
            <option value="Available">{t("available")}</option>
            <option value="Low">{t("lowStock")}</option>
            <option value="Out">{t("outOfStock")}</option>
          </select>
        </div>
        <ProductTable products={filteredProducts} onDelete={setPendingDelete} />
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        danger
        title={t("deleteProduct")}
        message={pendingDelete ? `${t("deleteProductConfirm")} "${pendingDelete.name}"?` : ""}
        confirmLabel={t("delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
