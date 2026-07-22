import { useNavigate, useParams } from "react-router-dom";
import { Check, FileText, ShoppingCart } from "lucide-react";
import ProductArt from "../components/ProductArt.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

function translateProductStatus(status) {
  if (!status) return "";
  if (status === "Quote ready") return status;
  if (status === "In stock") return t("inStock");
  if (status === "Available") return t("available");
  if (status === "Low stock") return t("lowStock");
  if (status === "Out of stock") return t("outOfStock");
  if (status === "Preorder") return t("preorderStatus");
  return status;
}

export default function ProductPage() {
  useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, cart } = useStore();
  const product = products.find((item) => item.id === id);
  const isInCart = Boolean(product && cart[product.id]);
  const availability = ["Active", "Inactive", "Draft"].includes(product?.status)
    ? (product?.stock > 0 ? t("inStock") : t("notAvailableYet"))
    : translateProductStatus(product?.status);

  if (!product) {
    return (
      <main className="main">
        <div className="empty">{t("productNotFound")}</div>
      </main>
    );
  }

  return (
    <main className="main">
      <section className="detail-grid">
        <div className="detail-media">
          <ProductArt product={product} />
          <span className="badge">{availability}</span>
        </div>
        <section className="panel">
          <div className="category">{product.category}</div>
          <h1>{product.name}</h1>
          <p className="lead">{product.desc}</p>
          <div className="kv">
            <div className="kv-row"><span>{t("price")}</span><strong>{money(product.price)}</strong></div>
            <div className="kv-row"><span>{t("availability")}</span><strong>{availability} - {product.stock} {t("units")}</strong></div>
            <div className="kv-row"><span>{t("leadTime")}</span><strong>{product.lead}</strong></div>
            <div className="kv-row"><span>{t("warranty")}</span><strong>{product.warranty}</strong></div>
          </div>
          <div className="specs">
            {product.specs.map((spec) => <span className="spec" key={spec}>{spec}</span>)}
          </div>
          {product.long_description && <p className="page-copy">{product.long_description}</p>}
          <div className="card-actions" style={{ marginTop: 18 }}>
            <button className="primary-btn" disabled={isInCart} onClick={() => {
              addToCart(product.id);
            }}>
              {isInCart ? <Check /> : <ShoppingCart />} {isInCart ? t("inCart") : t("addToCart")}
            </button>
            <button className="secondary-btn" type="button" onClick={() => {
              if (!isInCart) {
                addToCart(product.id);
              }
              navigate("/checkout");
            }}><FileText /> {t("buyNow")}</button>
          </div>
          {isInCart && (
            <div className="notice" style={{ marginTop: 12, color: "#1c7ed6" }}>
              {t("alreadyInCart")}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
