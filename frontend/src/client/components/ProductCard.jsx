import { Link, useNavigate } from "react-router-dom";
import { Check, FileText, ShoppingCart } from "lucide-react";
import ProductArt from "./ProductArt.jsx";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";
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

export default function ProductCard({ product }) {
  useLocale();
  const navigate = useNavigate();
  const { addToCart, cart } = useStore();
  const isInCart = Boolean(cart[product.id]);

  const badgeText = (() => {
    // Avoid showing legacy 'Quote ready' badge — prefer stock-based or existing status
    if (product.status && product.status !== "Quote ready") return translateProductStatus(product.status);
    if (typeof product.stock === "number" && product.stock > 0) return t("inStock");
    return t("notAvailableYet");
  })();

  const openDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAdd = (event) => {
    event.stopPropagation();
    addToCart(product.id);
  };

  const handleBuyNow = (event) => {
    event.stopPropagation();
    if (!isInCart) {
      addToCart(product.id);
    }
    navigate("/checkout");
  };

  return (
    <article className="card product-card" onClick={openDetails}>
        <Link className="product-media" to={`/product/${product.id}`} aria-label={product.name}>
        <ProductArt product={product} />
        <span className="badge">{badgeText}</span>
      </Link>

      <div className="product-body">
        <div className="product-top">
          <span className="category">{product.category}</span>
          <span className="price">{money(product.price)}</span>
        </div>
        <h3>{product.name}</h3>
        <p className="desc">{product.desc}</p>
        <div className="specs">
          {product.specs.map((spec) => (
            <span className="spec" key={spec}>
              {spec}
            </span>
          ))}
        </div>
        <div className="card-actions">
          <button className="primary-btn" onClick={handleAdd} disabled={isInCart}>
            {isInCart ? <Check /> : <ShoppingCart />}
            {isInCart ? t("inCart") : t("addToCart")}
          </button>
          <button className="secondary-btn" type="button" onClick={handleBuyNow}>
            <FileText />
            {t("buyNow")}
          </button>
        </div>
      </div>
    </article>
  );
}
