import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, FileText, ShoppingCart } from "lucide-react";
import ProductArt from "./ProductArt.jsx";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";
import {
  getProductShipsTo,
  isProductAvailableInCountry,
  readStoredShippingCountryCode,
  subscribeShippingCountry
} from "../../shared/lib/shipping.js";

function translateProductStatus(status) {
  if (!status) return "";
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
  const { addToCart, cart, user } = useStore();
  const isInCart = Boolean(cart[product.id]);
  const [shipCountryCode, setShipCountryCode] = useState(() => {
    return user ? (user.country_code || "") : readStoredShippingCountryCode();
  });

  useEffect(() => {
    // If an authenticated user exists, reflect their profile country and don't subscribe to guest updates.
    if (user) {
      setShipCountryCode(user.country_code || "");
      return () => {};
    }
    // For guests, subscribe to stored shipping country updates.
    return subscribeShippingCountry(setShipCountryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const countryAvailability = isProductAvailableInCountry(product, shipCountryCode);
  const needsCountryCheck = Boolean(getProductShipsTo(product));
  const notAvailableInCountry = countryAvailability.available === false;
  const isUnknownInCountry = needsCountryCheck && countryAvailability.available === null;
  const isOutOfStock = typeof product.stock === "number" && product.stock <= 0;

  const badgeText = (() => {
    if (notAvailableInCountry) return t("notAvailableInYourCountry");
    if (isUnknownInCountry) return t("checkAvailabilityInCountry");
    if (isOutOfStock) return t("outOfStock");
    if (["Draft"].includes(product.status)) {
      return typeof product.stock === "number" && product.stock > 0 ? t("inStock") : t("notAvailableYet");
    }
    if (product.status) return translateProductStatus(product.status);
    if (typeof product.stock === "number" && product.stock > 0) return t("inStock");
    return t("notAvailableYet");
  })();

  const openDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAdd = (event) => {
    event.stopPropagation();
    if (notAvailableInCountry || isOutOfStock || isUnknownInCountry) return;
    addToCart(product.id);
  };

  const handleBuyNow = (event) => {
    event.stopPropagation();
    if (notAvailableInCountry || isOutOfStock) return;
    if (!isInCart) {
      addToCart(product.id);
    }
    navigate("/checkout");
  };

  return (
    <article
      className="card product-card"
      onClick={openDetails}
      title={t("clickForMoreDetails")}
    >
        <Link
        className="product-media"
        to={`/product/${product.id}`}
        aria-label={product.name}
        onClick={(event) => event.stopPropagation()}
      >
        <ProductArt product={product} />
        <span className={`badge ${notAvailableInCountry ? "badge-unavailable" : ""}`}>{badgeText}</span>
      </Link>

      <div className="product-body">
        <div className="product-top">
          <span className="category">{product.category}</span>
          <span className="price">{money(product.price)}</span>
        </div>
        <h3>{product.name}</h3>
        <p className="desc">{product.desc}</p>
        <div className="specs">
          {(product.specs || []).map((spec) => (
            <span className="spec" key={spec}>
              {spec}
            </span>
          ))}
        </div>
        <div className="card-actions">
          <button
            className="primary-btn"
            onClick={handleAdd}
            disabled={isInCart || notAvailableInCountry || isOutOfStock || isUnknownInCountry}
          >
            {isInCart ? <Check /> : <ShoppingCart />}
            {isInCart
              ? t("inCart")
              : notAvailableInCountry
              ? t("notAvailableInYourCountry")
              : isOutOfStock
              ? t("outOfStock")
              : isUnknownInCountry
              ? t("checkAvailabilityInCountry")
              : t("addToCart")}
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={handleBuyNow}
            disabled={notAvailableInCountry || isOutOfStock || isUnknownInCountry}
          >
            <FileText />
            {isOutOfStock ? t("outOfStock") : isUnknownInCountry ? t("checkAvailabilityInCountry") : t("buyNow")}
          </button>
        </div>
      </div>
    </article>
  );
}
