import { ImagePlus, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { t, useLocale } from "../../i18n.js";
import { currencyOptionLabel } from "../../shared/lib/currency.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function EditProduct() {
  const { id } = useParams();
  const location = useLocation();
  useLocale();
  const navigate = useNavigate();
  const { user, products, categories, updateProduct, deleteProduct, currencies } = useStore();
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const productFromStore = products.find((item) => item.id === id);
  const [loadedProduct, setLoadedProduct] = useState(null);
  const [productLoaded, setProductLoaded] = useState(Boolean(productFromStore));
  const routeProduct = location.state?.product?.id === id ? location.state.product : null;
  const product = productFromStore || routeProduct || loadedProduct;
  const [newCategory, setNewCategory] = useState("");
  const [costPrice, setCostPrice] = useState(String(product?.cost_price || ""));
  // Admin editing must always use the stored base amount, never the customer
  // display amount (which can round a very small foreign-currency price to 0).
  const [price, setPrice] = useState(String(product?.base_price ?? product?.price ?? ""));
  const [baseCurrency, setBaseCurrency] = useState(product?.base_currency || "USD");
  const [shipsToCountries, setShipsToCountries] = useState((product?.ships_to_countries || []).join(", "));
  const [images, setImages] = useState(product?.images || []);
  const hasNewCategory = Boolean(newCategory.trim());

  useEffect(() => {
    if (productFromStore || routeProduct) {
      setProductLoaded(true);
      return;
    }
    if (!user?.token) return;
    let cancelled = false;
    createApiClient(user.token)(`/products/${encodeURIComponent(id)}`)
      .then((json) => {
        if (!cancelled) setLoadedProduct(json.data || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load product");
      })
      .finally(() => {
        if (!cancelled) setProductLoaded(true);
      });
    return () => { cancelled = true; };
  }, [id, productFromStore, routeProduct, user?.token]);

  useEffect(() => {
    if (!product) return;
    setCostPrice(String(product.cost_price || ""));
    setPrice(String(product.base_price ?? product.price ?? ""));
    setBaseCurrency(product.base_currency || "USD");
    setShipsToCountries((product.ships_to_countries || []).join(", "));
    setImages(product.images || []);
  }, [product?.id]);

  const pricingComplete = price !== "" && costPrice !== "";
  const grossProfit = pricingComplete ? Math.round((numberValue(price) - numberValue(costPrice)) * 100) / 100 : null;
  const grossMargin = grossProfit !== null && numberValue(price) ? Math.round((grossProfit / numberValue(price)) * 10000) / 100 : null;
  const optionalDimension = (value) => Number(value || 0) > 0 ? value : "";

  const addImages = async (files) => {
    const selected = [...files].filter((file) => imageTypes.includes(file.type));
    if (selected.length !== files.length) {
      setError(t("imageUploadTypeError"));
      return;
    }
    const dataUrls = await Promise.all(selected.map(readImage));
    setImages((current) => [...current, ...dataUrls].slice(0, 8));
  };

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
        base_price: numberValue(price || form.price),
        base_currency: baseCurrency,
        stock: Number(form.stock),
        cost_price: numberValue(costPrice || form.cost_price),
        ships_to_countries: shipsToCountries.split(/[,;\n]/).map((country) => country.trim()).filter(Boolean),
        // status removed from EditProduct form
        description: form.desc,
        lead: form.lead,
        warranty: form.warranty,
        specs: form.specs ? form.specs.split(",").map((item) => item.trim()).filter(Boolean) : [],
        images,
        brand: form.brand,
        weight_kg: numberValue(form.weight_kg),
        length_cm: numberValue(form.length_cm),
        width_cm: numberValue(form.width_cm),
        height_cm: numberValue(form.height_cm)
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
        <div className="empty">{productLoaded ? t("productNotFound") : t("loading")}</div>
      ) : (
        <form className="panel form-grid product-form" onSubmit={submit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <h3>{t("productBasics")}</h3>
            <input className="input" name="name" defaultValue={product.name} placeholder={t("productNamePlaceholder")} required />
            <div className="form-grid two">
              <input className="input" name="brand" defaultValue={product.brand || ""} placeholder={t("brand")} />
            </div>
          </div>

          <div className="form-section">
            <h3>{t("category")}</h3>
            <div className="form-grid two">
              <select className={`select ${hasNewCategory ? "is-muted-control" : ""}`} name="category" defaultValue={product.category || categories[0]?.name || ""} disabled={hasNewCategory}>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <input className="input" name="newCategory" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={t("orNewCategoryPlaceholder")} />
            </div>
          </div>

          <div className="form-section">
            <h3>{t("pricing")}</h3>
            <div className="form-grid four">
              <label className="field-group"><span>{t("sellingPrice")}</span><input className="input" name="price" type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={t("sellingPrice")} required /></label>
              <label className="field-group"><span>{t("cost")}</span><input className="input" name="cost_price" type="number" min="0" step="0.01" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder={t("costPricePlaceholder")} /></label>
              <label className="field-group"><span>{t("grossProfit")}</span><div className={`input muted-input gross-profit-preview ${grossProfit !== null && grossProfit < 0 ? "is-loss" : ""}`}>{grossProfit === null ? "—" : `${grossProfit.toFixed(2)} ${baseCurrency} (${grossMargin}%)`}</div></label>
              <label className="field-group"><span>Base currency</span><select className="select" name="base_currency" value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value)}>{(currencies.length ? currencies : [{ code: "USD", name: "US Dollar", symbol: "$" }]).map((item) => <option key={item.code} value={item.code}>{currencyOptionLabel(item)}</option>)}</select></label>
              <label className="field-group"><span>{t("stock")}</span><input className="input" name="stock" type="number" min="0" defaultValue={product.stock} placeholder={t("stockPlaceholder")} required /></label>
            </div>
          </div>

          <div className="form-section">
            <h3>{t("productImages")}</h3>
            <div
              className="image-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addImages(event.dataTransfer.files);
              }}
            >
              <ImagePlus />
              <strong>{t("uploadImages")}</strong>
              <span>{t("imageUploadHint")}</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => addImages(event.target.files || [])} />
            </div>
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((image, index) => (
                  <div className="image-preview" key={`${image.slice(0, 24)}-${index}`}>
                    <img src={image} alt="" />
                    <button type="button" onClick={() => setImages(images.filter((_, itemIndex) => itemIndex !== index))} aria-label={t("remove")}>
                      <X />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>{t("shipping")}</h3>
            <div className="form-grid four">
              <label className="field-group"><span>{t("weightKg")}</span><input className="input" name="weight_kg" type="number" min="0" step="0.01" defaultValue={optionalDimension(product.weight_kg)} placeholder={t("weightKg")} /></label>
              <label className="field-group"><span>{t("lengthCm")}</span><input className="input" name="length_cm" type="number" min="0" step="0.01" defaultValue={optionalDimension(product.dimensions?.length_cm)} placeholder={t("lengthCm")} /></label>
              <label className="field-group"><span>{t("widthCm")}</span><input className="input" name="width_cm" type="number" min="0" step="0.01" defaultValue={optionalDimension(product.dimensions?.width_cm)} placeholder={t("widthCm")} /></label>
              <label className="field-group"><span>{t("heightCm")}</span><input className="input" name="height_cm" type="number" min="0" step="0.01" defaultValue={optionalDimension(product.dimensions?.height_cm)} placeholder={t("heightCm")} /></label>
            </div>
            <label className="field-group" style={{ marginTop: 14 }}>
              <span>{t("shipsToCountries")}</span>
              <input className="input" value={shipsToCountries} onChange={(event) => setShipsToCountries(event.target.value)} placeholder="TN, FR, DE — leave empty for worldwide" />
            </label>
          </div>

          <div className="form-section">
            <h3>{t("description")}</h3>
            <div className="form-grid two">
              <input className="input" name="lead" defaultValue={product.lead || ""} placeholder={t("leadTimePlaceholder")} />
              <input className="input" name="warranty" defaultValue={product.warranty || ""} placeholder={t("warranty")} />
            </div>
            <input className="input" name="specs" defaultValue={(product.specs || []).join(", ")} placeholder={t("specsPlaceholder")} />
            <textarea name="desc" defaultValue={product.desc || product.description || ""} placeholder={t("shortDescriptionPlaceholder")} />
          </div>

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
