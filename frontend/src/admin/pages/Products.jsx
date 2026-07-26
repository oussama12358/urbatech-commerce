import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import ProductTable from "../components/ProductTable.jsx";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Products() {
  const locale = useLocale();
  const { products, categories, deleteProduct } = useStore();
  const [searchParams] = useSearchParams();
  const supplierFilter = searchParams.get("supplier_id") || "";
  const sourceFilter = searchParams.get("source") || "All";
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [source, setSource] = useState(sourceFilter);
  const [stock, setStock] = useState("All");

  useEffect(() => {
    setSource(sourceFilter);
  }, [sourceFilter]);

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
      const matchesSupplier = !supplierFilter || product.supplier_id === supplierFilter;
      const matchesStock =
        stock === "All" ||
        (stock === "In stock" && product.stock > 0) ||
        (stock === "Low" && product.stock > 0 && product.stock <= 10) ||
        (stock === "Out" && product.stock === 0);
      return matchesQuery && matchesCategory && matchesSource && matchesSupplier && matchesStock;
    });
  }, [category, products, query, source, stock, supplierFilter]);

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
          <span>{supplierFilter ? t("supplierProductsFilterActive") : productCountLabel}</span>
        </div>
        {supplierFilter && (
          <div className="field-note" style={{ marginBottom: 12 }}>
            {t("supplierProductsFilterActive")}
            <Link className="link-button" style={{ marginLeft: 10 }} to="/admin/products">
              {t("showAllProducts")}
            </Link>
          </div>
        )}
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
          <select className="select" value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="All">{t("allStock")}</option>
            <option value="In stock">{t("inStockStatus")}</option>
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
