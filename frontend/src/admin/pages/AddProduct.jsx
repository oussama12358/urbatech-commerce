import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";

export default function AddProduct() {
  const { addProduct, categories, suppliers } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const category = form.newCategory?.trim() || form.category;
    try {
      await addProduct({
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
      setError(err.message || "Unable to add product");
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Add product</h2>
        </div>
      </div>
      <form className="panel form-grid" onSubmit={submit}>
        {error && <div className="error-message">{error}</div>}
        <input className="input" name="name" placeholder="Product name" required />
        <div className="form-grid two">
          <select className="select" name="supplier_id" defaultValue="">
            <option value="">No supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
            ))}
          </select>
          <input className="input" name="supplier_product_id" placeholder="Supplier Product ID" />
        </div>
        <div className="form-grid two">
          <select className="select" name="category" defaultValue={categories[0]?.name || ""}>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <input className="input" name="newCategory" placeholder="Or new category" />
        </div>
        <div className="form-grid two">
          <input className="input" name="price" type="number" min="0" step="0.01" placeholder="Price" required />
          <input className="input" name="cost_price" type="number" min="0" step="0.01" placeholder="Cost price" />
        </div>
        <div className="form-grid two">
          <input className="input" name="stock" type="number" min="0" placeholder="Stock" required />
          <input className="input" name="margin" type="number" min="0" step="0.01" placeholder="Margin %" required />
        </div>
        <label className="inline-check">
          <input type="checkbox" name="auto_sync" /> Auto Sync
        </label>
        <div className="form-grid two">
          <select className="select" name="status" defaultValue="In stock">
            <option>In stock</option>
            <option>Low stock</option>
            <option>Out of stock</option>
            <option>Preorder</option>
          </select>
        </div>
        <div className="form-grid two">
          <input className="input" name="lead" placeholder="Lead time" />
          <input className="input" name="warranty" placeholder="Warranty" />
        </div>
        <input className="input" name="specs" placeholder="Specs separated by commas" />
        <textarea name="desc" placeholder="Short description" />
        <button className="primary-btn" type="submit">Add product</button>
      </form>
    </main>
  );
}
