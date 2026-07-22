import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function ProductTable({ products, onDelete }) {
  useLocale();
  const sourceLabel = (source, supplierId) => {
    const value = source || (supplierId ? "api" : "internal");
    if (value === "api") return t("sourceApi");
    if (value === "import") return t("sourceImport");
    return t("sourceInternal");
  };

  const supplierStatusLabel = (status) => {
    if (status === "inactive") return t("inactive");
    if (status === "discontinued") return t("discontinued");
    if (status === "out_of_stock") return t("outOfStock");
    return t("active");
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  if (!products.length) {
    return <div className="empty">{t("noProductsYet")}</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>{t("product")}</th>
          <th>{t("sku")}</th>
          <th>{t("source")}</th>
          <th>{t("supplierStatus")}</th>
          <th>{t("lastSync")}</th>
          <th>{t("supplierId")}</th>
          <th>{t("categories")}</th>
          <th>{t("price")}</th>
          <th>{t("cost")}</th>
          <th>{t("stock")}</th>
          <th>{t("margin")}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.sku || "-"}</td>
            <td>{sourceLabel(product.product_source, product.supplier_id)}</td>
            <td>{supplierStatusLabel(product.supplier_status)}</td>
            <td>{formatLastSync(product.supplier_last_sync_at)}</td>
            <td>{product.supplier_product_id || "-"}</td>
            <td>{product.category}</td>
            <td>{money(product.price)}</td>
            <td>{money(product.cost_price || 0)}</td>
            <td>{product.stock}</td>
            <td>{product.margin}%</td>
            <td>
              <div className="row-actions">
                <Link className="icon-btn" to={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                  <Pencil />
                </Link>
                {onDelete && (
                  <button
                    className="icon-btn danger-icon"
                    type="button"
                    title={`Delete ${product.name}`}
                    aria-label={`Delete ${product.name}`}
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
