import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import ProductTable from "../components/ProductTable.jsx";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function Products() {
  const { products, categories, deleteProduct } = useStore();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [stock, setStock] = useState("All");
  const statuses = useMemo(() => ["All", ...new Set(products.map((product) => product.status).filter(Boolean))], [products]);

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
      const matchesStatus = status === "All" || product.status === status;
      const matchesStock =
        stock === "All" ||
        (stock === "Available" && product.stock > 0) ||
        (stock === "Low" && product.stock > 0 && product.stock <= 10) ||
        (stock === "Out" && product.stock === 0);
      return matchesQuery && matchesCategory && matchesStatus && matchesStock;
    });
  }, [category, products, query, status, stock]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteProduct(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Products</h2>
        </div>
        <Link className="primary-btn" to="/admin/products/new">
          <Plus />
          Add product
        </Link>
      </div>
      <section className="panel">
        <div className="admin-section-head">
          <h2>Catalogue list</h2>
          <span>{filteredProducts.length} of {products.length} products</span>
        </div>
        <div className="admin-filter-bar">
          <input className="input" type="search" placeholder="Search name, category, specs..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="All">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
          <select className="select" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>{item === "All" ? "All statuses" : item}</option>
            ))}
          </select>
          <select className="select" value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="All">All stock</option>
            <option value="Available">Available</option>
            <option value="Low">Low stock</option>
            <option value="Out">Out of stock</option>
          </select>
        </div>
        <ProductTable products={filteredProducts} onDelete={setPendingDelete} />
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        danger
        title="Delete product"
        message={pendingDelete ? `Delete "${pendingDelete.name}" from the catalogue?` : ""}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
