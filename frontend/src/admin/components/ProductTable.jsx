import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";
import { useStore } from "../../store/StoreContext.jsx";

export default function ProductTable({ products, onDelete }) {
  useLocale();
  const { suppliers } = useStore();
  const sourceLabel = (source, supplierId) => {
    const value = source || (supplierId ? "api" : "internal");
    if (value === "api") return t("sourceApi");
    if (value === "import") return t("sourceImport");
    return t("sourceInternal");
  };

  const supplierName = (product) => product.supplier_name || (suppliers || []).find((supplier) => supplier.id === product.supplier_id)?.company_name || "";

  const supplierStatusLabel = (status, stock) => {
    if (typeof stock === "number" && stock <= 0) return t("outOfStock");
    const s = String(status || "").toLowerCase();
    if (s === "discontinued") return t("discontinued");
    if (s === "out_of_stock" || s === "outofstock") return t("outOfStock");
    if (s === "active") return t("active");
    if (s === "inactive") return t("inactive");
    return "";
  };

  const supplierStatusVariant = (status, stock) => {
    const s = String(status || "").toLowerCase();
    if (typeof stock === "number" && stock <= 0) return "disconnected";
    if (s === "active") return "connected";
    return "disconnected";
  };

  const supplierConnectionLabel = (supplierId) => {
    if (!supplierId) return "";
    const s = (suppliers || []).find((x) => x.id === supplierId);
    if (!s) return "";
    const health = String(s.api_health || s.status || "").toLowerCase();
    if (health.includes("online") || health.includes("connected") || health.includes("ok")) return t("connected");
    return t("disconnected");
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const marginFor = (product) => {
    const sellingPrice = Number(product.base_price ?? product.price ?? 0);
    if (!sellingPrice) return 0;
    return Math.round(((sellingPrice - Number(product.cost_price || 0)) / sellingPrice) * 10000) / 100;
  };

  if (!products.length) {
    return <div className="empty">{t("noProductsYet")}</div>;
  }

  return (
    <div className="table-responsive">
    <table className="table product-table">
      <thead>
        <tr>
          <th>{t("product")}</th>
          <th>{t("sku")}</th>
          <th>{t("source")}</th>
          <th>{t("supplierStatus")}</th>
          <th>{t("lastSync")}</th>
          <th>{t("supplierProductId")}</th>
          <th>{t("categories")}</th>
          <th>{t("price")}</th>
          <th>{t("cost")}</th>
          <th>{t("stock")}</th>
          <th>{t("margin")}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const baseCurrency = product.base_currency || product.currency || "USD";
          const basePrice = Number(product.base_price ?? product.price ?? 0);
          const margin = marginFor(product);
          return (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.sku || "-"}</td>
            <td>
              <div>{sourceLabel(product.product_source, product.supplier_id)}</div>
              {product.supplier_id && supplierName(product) && <div className="muted">{supplierName(product)}</div>}
            </td>
            <td>
              {(() => {
                const statusText = supplierStatusLabel(product.supplier_status, product.stock);
                if (!statusText) return "";
                const variant = supplierStatusVariant(product.supplier_status, product.stock);
                return <span className={`status-pill ${variant}`}>{statusText}</span>;
              })()}
            </td>
            <td>{formatLastSync(product.supplier_last_sync_at)}</td>
            <td>{product.supplier_product_id || "—"}</td>
            <td>{product.category}</td>
            <td>{money(basePrice, baseCurrency)}</td>
            <td>{money(product.cost_price || 0, baseCurrency)}</td>
            <td>{product.stock}</td>
            <td className={margin < 0 ? "margin-loss" : ""}>{margin}%</td>
            <td>
              <div className="row-actions">
                <Link className="icon-btn" to={`/admin/products/${product.id}/edit`} state={{ product }} aria-label={t("editProductNamed").replace("{name}", product.name)}>
                  <Pencil />
                </Link>
                {onDelete && (
                  <button
                    className="icon-btn danger-icon"
                    type="button"
                    title={t("deleteProductNamed").replace("{name}", product.name)}
                    aria-label={t("deleteProductNamed").replace("{name}", product.name)}
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </td>
          </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}
