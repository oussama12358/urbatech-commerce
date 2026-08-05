import { ImagePlus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";
import { currencyOptionLabel } from "../../shared/lib/currency.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computedPrice(cost, margin) {
  return Math.round(cost * (1 + margin / 100) * 100) / 100;
}

function RequiredLabel({ children }) {
  return (
    <span className="required-label">
      {children}
      <strong>*</strong>
    </span>
  );
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function AddProduct() {
  useLocale();
  const { addProduct, categories, currencies } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [margin, setMargin] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const hasNewCategory = Boolean(newCategory.trim());

  const handleCostChange = (value) => {
    setCostPrice(value);
    if (value !== "" && margin !== "") {
      setPrice(String(computedPrice(numberValue(value), numberValue(margin))));
    } else {
      setPrice("");
    }
  };

  const handleMarginChange = (value) => {
    setMargin(value);
    if (costPrice !== "" && value !== "") {
      setPrice(String(computedPrice(numberValue(costPrice), numberValue(value))));
    } else {
      setPrice("");
    }
  };

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
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const category = form.newCategory?.trim() || form.category;

        try {
      await addProduct({
        name: form.name,
        category,
        base_price: numberValue(price || form.price),
        base_currency: form.base_currency || "USD",
        stock: Number(form.stock),
        margin: numberValue(margin || form.margin),
        cost_price: numberValue(costPrice || form.cost_price),
        product_source: "internal",
        auto_sync: false,
        // status field removed from AddProduct form
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
      setError(err.message || "Unable to add product");
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("catalogue")}</p>
          <h2>{t("addProduct")}</h2>
        </div>
        <Link className="secondary-btn" to="/admin/products">{t("backToProducts")}</Link>
      </div>

      <form className="panel form-grid product-form" onSubmit={submit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h3>{t("productBasics")}</h3>
          <label className="field-group">
            <RequiredLabel>{t("product")}</RequiredLabel>
            <input className="input" name="name" placeholder={t("productNamePlaceholder")} required />
          </label>
          <div className="form-grid two">
            <label className="field-group">
              <span>{t("brand")}</span>
              <input className="input" name="brand" placeholder={t("brand")} />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>{t("category")}</h3>
          <div className="form-grid two">
            <label className="field-group">
              <RequiredLabel>{t("category")}</RequiredLabel>
              <select className={`select ${hasNewCategory ? "is-muted-control" : ""}`} name="category" defaultValue={categories[0]?.name || ""} disabled={hasNewCategory}>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span>{t("orNewCategoryPlaceholder")}</span>
              <input className="input" name="newCategory" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={t("orNewCategoryPlaceholder")} />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>{t("pricing")}</h3>
          <div className="form-grid four">
            <label className="field-group">
              <RequiredLabel>{t("cost")}</RequiredLabel>
              <input className="input" name="cost_price" type="number" min="0" step="0.01" value={costPrice} onChange={(event) => handleCostChange(event.target.value)} placeholder={t("costPricePlaceholder")} required />
            </label>
            <label className="field-group">
              <RequiredLabel>{t("margin")}</RequiredLabel>
              <input className="input" name="margin" type="number" min="0" step="0.01" value={margin} onChange={(event) => handleMarginChange(event.target.value)} placeholder={t("marginPlaceholder")} required />
            </label>
            <label className="field-group">
              <RequiredLabel>Base selling price</RequiredLabel>
              <input className="input" name="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={t("sellingPrice")} required />
            </label>
            <label className="field-group">
              <RequiredLabel>Base currency</RequiredLabel>
              <select className="select" name="base_currency" defaultValue="USD">
                {(currencies.length ? currencies : [{ code: "USD", name: "US Dollar", symbol: "$" }]).map((item) => <option key={item.code} value={item.code}>{currencyOptionLabel(item)}</option>)}
              </select>
            </label>
            <label className="field-group">
              <RequiredLabel>{t("stock")}</RequiredLabel>
              <input className="input" name="stock" type="number" min="0" placeholder={t("stock")} required />
            </label>
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
            <label className="field-group"><span>{t("weightKg")}</span><input className="input" name="weight_kg" type="number" min="0" step="0.01" placeholder={t("weightKg")} /></label>
            <label className="field-group"><span>{t("lengthCm")}</span><input className="input" name="length_cm" type="number" min="0" step="0.01" placeholder={t("lengthCm")} /></label>
            <label className="field-group"><span>{t("widthCm")}</span><input className="input" name="width_cm" type="number" min="0" step="0.01" placeholder={t("widthCm")} /></label>
            <label className="field-group"><span>{t("heightCm")}</span><input className="input" name="height_cm" type="number" min="0" step="0.01" placeholder={t("heightCm")} /></label>
          </div>
        </div>

        <div className="form-section">
          <h3>{t("description")}</h3>
          <div className="form-grid two">
            <label className="field-group"><span>{t("leadTime")}</span><input className="input" name="lead" placeholder={t("leadTime")} /></label>
            <label className="field-group"><span>{t("warranty")}</span><input className="input" name="warranty" placeholder={t("warranty")} /></label>
          </div>
          <label className="field-group"><span>{t("specsPlaceholder")}</span><input className="input" name="specs" placeholder={t("specsPlaceholder")} /></label>
          <label className="field-group"><span>{t("description")}</span><textarea name="desc" placeholder={t("shortDescriptionPlaceholder")} /></label>
        </div>

        <button className="primary-btn" type="submit">{t("addProduct")}</button>
      </form>
    </main>
  );
}
