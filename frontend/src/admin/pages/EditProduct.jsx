import { ImagePlus, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computedPrice(cost, margin) {
  return Math.round(cost * (1 + margin / 100) * 100) / 100;
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
  useLocale();
  const navigate = useNavigate();
  const { products, categories, updateProduct, deleteProduct } = useStore();
  const [error, setError] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const product = products.find((item) => item.id === id);
  const [newCategory, setNewCategory] = useState("");
  const [costPrice, setCostPrice] = useState(String(product?.cost_price || ""));
  const [margin, setMargin] = useState(String(product?.margin || ""));
  const [price, setPrice] = useState(String(product?.price || ""));
  const [images, setImages] = useState(product?.images || []);
  const hasNewCategory = Boolean(newCategory.trim());

  useEffect(() => {
    if (!product) return;
    setCostPrice(String(product.cost_price || ""));
    setMargin(String(product.margin || ""));
    setPrice(String(product.price || ""));
    setImages(product.images || []);
  }, [product?.id]);

  const handleCostChange = (value) => {
    setCostPrice(value);
    if (value !== "" && margin !== "") setPrice(String(computedPrice(numberValue(value), numberValue(margin))));
  };

  const handleMarginChange = (value) => {
    setMargin(value);
    if (costPrice !== "" && value !== "") setPrice(String(computedPrice(numberValue(costPrice), numberValue(value))));
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
    if (!product) return;
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const category = form.newCategory?.trim() || form.category;

      try {
      await updateProduct(product.id, {
        name: form.name,
        category,
        price: numberValue(price || form.price),
        stock: Number(form.stock),
        margin: numberValue(margin || form.margin),
        cost_price: numberValue(costPrice || form.cost_price),
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
        <div className="empty">{t("productNotFound")}</div>
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
              <input className="input" name="cost_price" type="number" min="0" step="0.01" value={costPrice} onChange={(event) => handleCostChange(event.target.value)} placeholder={t("costPricePlaceholder")} />
              <input className="input" name="margin" type="number" min="0" step="0.01" value={margin} onChange={(event) => handleMarginChange(event.target.value)} placeholder={t("marginPlaceholder")} required />
              <input className="input" name="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder={t("sellingPrice")} required />
              <input className="input" name="stock" type="number" min="0" defaultValue={product.stock} placeholder={t("stockPlaceholder")} required />
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
              <input className="input" name="weight_kg" type="number" min="0" step="0.01" defaultValue={product.weight_kg || 0} placeholder={t("weightKg")} />
              <input className="input" name="length_cm" type="number" min="0" step="0.01" defaultValue={product.dimensions?.length_cm || 0} placeholder={t("lengthCm")} />
              <input className="input" name="width_cm" type="number" min="0" step="0.01" defaultValue={product.dimensions?.width_cm || 0} placeholder={t("widthCm")} />
              <input className="input" name="height_cm" type="number" min="0" step="0.01" defaultValue={product.dimensions?.height_cm || 0} placeholder={t("heightCm")} />
            </div>
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
