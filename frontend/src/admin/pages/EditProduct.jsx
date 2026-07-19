import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function EditProduct() {
  const { id } = useParams();
  useLocale();
  const navigate = useNavigate();
  const { products, categories, suppliers, updateProduct, deleteProduct } = useStore();
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const product = products.find((item) => item.id === id);

  const submit = async (event) => {
    event.preventDefault();
    if (!product) return;
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const category = form.newCategory?.trim() || form.category;
    try {
      await updateProduct(product.id, {
        name: form.name,
        category,
        price: Number(form.price),
        stock: Number(form.stock),
        margin: Number(form.margin),
        cost_price: Number(form.cost_price || 0),
        supplier_id: form.supplier_id || "",
        supplier_product_id: form.supplier_product_id || "",
        auto_sync: Boolean(form.auto_sync),
        status: form.status,
        description: form.desc,
        lead: form.lead,
        warranty: form.warranty,
        specs: form.specs ? form.specs.split(",").map((item) => item.trim()).filter(Boolean) : []
      });
      navigate("/admin/products");
    } catch (err) {
      setError(err.message || "Unable to update product");
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    await deleteProduct(product.id);
    navigate("/admin/products");
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("catalogue")}</p>
          <h2>{t("editProductTitle")}</h2>
        </div>
        <Link className="secondary-btn" to="/admin/products">{t("backToProducts")}</Link>
      </div>
      {!product ? (
        <div className="empty">{t("productNotFound")}</div>
      ) : (
        <form className="panel form-grid" onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <input className="input" name="name" defaultValue={product.name} placeholder={t("productNamePlaceholder")} required />
          <div className="form-grid two">
            <select className="select" name="supplier_id" defaultValue={product.supplier_id || ""}>
              <option value="">{t("noSupplier")}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
              ))}
            </select>
            <input className="input" name="supplier_product_id" defaultValue={product.supplier_product_id || ""} placeholder={t("supplierProductIdPlaceholder")} />
          </div>
          <div className="form-grid two">
            <select className="select" name="category" defaultValue={product.category || categories[0]?.name || ""}>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <input className="input" name="newCategory" placeholder={t("orNewCategoryPlaceholder")} />
          </div>
          <div className="form-grid two">
            <input className="input" name="price" type="number" min="0" step="0.01" defaultValue={product.price} placeholder={t("pricePlaceholder")} required />
            <input className="input" name="cost_price" type="number" min="0" step="0.01" defaultValue={product.cost_price || 0} placeholder={t("costPricePlaceholder")} />
          </div>
          <div className="form-grid two">
            <input className="input" name="stock" type="number" min="0" defaultValue={product.stock} placeholder={t("stockPlaceholder")} required />
            <input className="input" name="margin" type="number" min="0" step="0.01" defaultValue={product.margin} placeholder={t("marginPlaceholder")} required />
          </div>
          <label className="inline-check">
            <input type="checkbox" name="auto_sync" defaultChecked={Boolean(product.auto_sync)} /> {t("autoSync")}
          </label>
          <div className="form-grid two">
            <select className="select" name="status" defaultValue={product.status || "In stock"}>
              <option value="In stock">{t("inStockStatus")}</option>
              <option value="Low stock">{t("lowStockStatus")}</option>
              <option value="Out of stock">{t("outOfStockStatus")}</option>
              <option value="Preorder">{t("preorderStatus")}</option>
            </select>
          </div>
          <div className="form-grid two">
            <input className="input" name="lead" defaultValue={product.lead || ""} placeholder={t("leadTimePlaceholder")} />
            <input className="input" name="warranty" defaultValue={product.warranty || ""} placeholder={t("warranty")} />
          </div>
          <input className="input" name="specs" defaultValue={(product.specs || []).join(", ")} placeholder={t("specsPlaceholder")} />
          <textarea name="desc" defaultValue={product.desc || product.description || ""} placeholder={t("shortDescriptionPlaceholder")} />
          <div className="form-grid two">
            <button className="primary-btn" type="submit">{t("saveChanges")}</button>
            <button className="danger-btn" type="button" onClick={() => setConfirmDeleteOpen(true)}>{t("deleteProduct")}</button>
          </div>
        </form>
      )}
      <ConfirmDialog
        open={confirmDeleteOpen}
        danger
        title={t("deleteProduct")}
        message={product ? t("deleteProductConfirm") : ""}
        confirmLabel={t("deleteProduct")}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
