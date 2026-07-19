import { useMemo, useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Categories() {
  useLocale();
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
          <p className="eyebrow">{t("catalogue")}</p>
          <h2>{t("categories")}</h2>
        </div>
      </div>
      <form className="panel form-grid" onSubmit={submit} style={{ marginBottom: 18 }}>
        <h2>{t("addCategory")}</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-grid two">
          <input className="input" name="name" placeholder={t("categoryNamePlaceholder")} required />
          <button className="primary-btn" type="submit">{t("addCategory")}</button>
        </div>
      </form>
      <section className="panel">
        <div className="admin-section-head">
          <h2>{t("categoryList")}</h2>
          <span>{filteredCategories.length} {t("of")} {categories.length} {t("categories")}</span>
        </div>
        <div className="admin-filter-bar">
          <input className="input" type="search" placeholder={t("searchCategoriesPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="select" value={usage} onChange={(event) => setUsage(event.target.value)}>
            <option value="All">{t("allUsage")}</option>
            <option value="Used">{t("inUse")}</option>
            <option value="Empty">{t("emptyUsage")}</option>
          </select>
        </div>
        {filteredCategories.length ? (
          <table className="table">
            <thead><tr><th>{t("category")}</th><th>{t("products")}</th><th>{t("actions")}</th></tr></thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.product_count}</td>
                  <td>
                    <div className="row-actions">
                      <button className="danger-btn compact-btn" type="button" onClick={() => setPendingDelete(category)}>{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">{t("noCategoriesMatchFilters")}</div>}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        danger
        title={t("deleteCategoryTitle")}
        message={
          pendingDelete
            ? `${t("deleteCategoryConfirm")} ${pendingDelete.name}? ${t("deleteCategoryWarning")} ${pendingDelete.product_count} ${t("products")}.`
            : ""
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
