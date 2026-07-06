import { useMemo, useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useStore();
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("All");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesQuery = !q || category.name.toLowerCase().includes(q);
      const matchesUsage =
        usage === "All" ||
        (usage === "Used" && category.product_count > 0) ||
        (usage === "Empty" && category.product_count === 0);
      return matchesQuery && matchesUsage;
    });
  }, [categories, query, usage]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    try {
      await addCategory({ name: form.name });
      formElement.reset();
    } catch (err) {
      setError(err.message || "Unable to add category");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setError(err.message || "Unable to delete category");
      setPendingDelete(null);
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2>Categories</h2>
        </div>
      </div>
      <form className="panel form-grid" onSubmit={submit} style={{ marginBottom: 18 }}>
        <h2>Add category</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-grid two">
          <input className="input" name="name" placeholder="Category name" required />
          <button className="primary-btn" type="submit">Add category</button>
        </div>
      </form>
      <section className="panel">
        <div className="admin-section-head">
          <h2>Category list</h2>
          <span>{filteredCategories.length} of {categories.length} categories</span>
        </div>
        <div className="admin-filter-bar">
          <input className="input" type="search" placeholder="Search categories..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="select" value={usage} onChange={(event) => setUsage(event.target.value)}>
            <option value="All">All usage</option>
            <option value="Used">In use</option>
            <option value="Empty">Empty</option>
          </select>
        </div>
        {filteredCategories.length ? (
          <table className="table">
            <thead><tr><th>Category</th><th>Products</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.product_count}</td>
                  <td>
                    <div className="row-actions">
                      <button className="danger-btn compact-btn" type="button" onClick={() => setPendingDelete(category)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">No categories match these filters.</div>}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        danger
        title="Delete category"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This will permanently remove this category and ${pendingDelete.product_count} product${pendingDelete.product_count === 1 ? "" : "s"} inside it. This action is irreversible.`
            : ""
        }
        confirmLabel="Yes, delete"
        cancelLabel="No"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
