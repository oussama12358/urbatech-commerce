import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function EditProduct() {
  const { id } = useParams();
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
          <p className="eyebrow">Catalogue</p>
          <h2>Edit product</h2>
        </div>
        <Link className="secondary-btn" to="/admin/products">Back to products</Link>
      </div>
      {!product ? (
        <div className="empty">Product not found.</div>
      ) : (
        <form className="panel form-grid" onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}
          <input className="input" name="name" defaultValue={product.name} placeholder="Product name" required />
          <div className="form-grid two">
            <select className="select" name="supplier_id" defaultValue={product.supplier_id || ""}>
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
              ))}
            </select>
            <input className="input" name="supplier_product_id" defaultValue={product.supplier_product_id || ""} placeholder="Supplier Product ID" />
          </div>
          <div className="form-grid two">
            <select className="select" name="category" defaultValue={product.category || categories[0]?.name || ""}>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <input className="input" name="newCategory" placeholder="Or new category" />
          </div>
          <div className="form-grid two">
            <input className="input" name="price" type="number" min="0" step="0.01" defaultValue={product.price} placeholder="Price" required />
            <input className="input" name="cost_price" type="number" min="0" step="0.01" defaultValue={product.cost_price || 0} placeholder="Cost price" />
          </div>
          <div className="form-grid two">
            <input className="input" name="stock" type="number" min="0" defaultValue={product.stock} placeholder="Stock" required />
            <input className="input" name="margin" type="number" min="0" step="0.01" defaultValue={product.margin} placeholder="Margin %" required />
          </div>
          <label className="inline-check">
            <input type="checkbox" name="auto_sync" defaultChecked={Boolean(product.auto_sync)} /> Auto Sync
          </label>
          <div className="form-grid two">
            <select className="select" name="status" defaultValue={product.status || "In stock"}>
              <option>In stock</option>
              <option>Low stock</option>
              <option>Out of stock</option>
              <option>Preorder</option>
            </select>
          </div>
          <div className="form-grid two">
            <input className="input" name="lead" defaultValue={product.lead || ""} placeholder="Lead time" />
            <input className="input" name="warranty" defaultValue={product.warranty || ""} placeholder="Warranty" />
          </div>
          <input className="input" name="specs" defaultValue={(product.specs || []).join(", ")} placeholder="Specs separated by commas" />
          <textarea name="desc" defaultValue={product.desc || product.description || ""} placeholder="Short description" />
          <div className="form-grid two">
            <button className="primary-btn" type="submit">Save changes</button>
            <button className="danger-btn" type="button" onClick={() => setConfirmDeleteOpen(true)}>Delete product</button>
          </div>
        </form>
      )}
      <ConfirmDialog
        open={confirmDeleteOpen}
        danger
        title="Delete product"
        message={product ? `Delete "${product.name}" from the catalogue?` : ""}
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
