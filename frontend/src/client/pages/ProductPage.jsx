import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, FileText, ShoppingCart } from "lucide-react";
import ProductArt from "../components/ProductArt.jsx";
import Loading from "../../shared/components/Loading.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";
import COUNTRIES, { getCountryByCode } from "../../shared/lib/countries.js";
import {
  formatShipsToLabel,
  getProductShipsTo,
  isProductAvailableInCountry,
  readStoredShippingCountryCode,
  writeShippingCountryCode
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

export default function ProductPage() {
  useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, productsLoading, addToCart, cart, user, updateProfile } = useStore();
  const [product, setProduct] = useState(() => products.find((item) => item.id === id) || null);
  const [directProductLoading, setDirectProductLoading] = useState(false);
  const [directProductTried, setDirectProductTried] = useState(false);
  const isInCart = Boolean(product && cart[product.id]);
  const [shipCountryCode, setShipCountryCode] = useState(() => {
    return user?.country_code || readStoredShippingCountryCode();
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    const matchedProduct = products.find((item) => item.id === id);
    if (matchedProduct) {
      setProduct(matchedProduct);
      setDirectProductTried(false);
      return;
    }

    setProduct(null);
    setDirectProductTried(false);
  }, [id, products]);

  useEffect(() => {
    if (product || directProductLoading || directProductTried) return;

    setDirectProductLoading(true);
    const api = createApiClient(user?.token);
    api(`/products/${encodeURIComponent(id)}`)
      .then((json) => {
        if (json?.data) {
          setProduct(json.data);
        }
      })
      .catch(() => {
        // no-op
      })
      .finally(() => {
        setDirectProductLoading(false);
        setDirectProductTried(true);
      });
  }, [id, product, directProductLoading, directProductTried, user?.token]);

  const selectedShipCountry = useMemo(
    () => (shipCountryCode ? getCountryByCode(shipCountryCode) : null),
    [shipCountryCode]
  );

  const availabilityCheck = useMemo(
    () => (product ? isProductAvailableInCountry(product, selectedShipCountry) : null),
    [product, selectedShipCountry]
  );

  const needsCountryCheck = Boolean(product && getProductShipsTo(product));

  const notAvailableInCountry = availabilityCheck?.available === false;
  const isUnknownInCountry = needsCountryCheck && availabilityCheck?.available === null;
  const isOutOfStock = product?.stock <= 0;
  const shipsToLabel = product ? formatShipsToLabel(product) : null;

  const availability = isOutOfStock
    ? t("outOfStock")
    : isUnknownInCountry
    ? t("checkAvailabilityInCountry")
    : t("inStock");

  // This must stay before the loading return: after a hard refresh the product
  // loads asynchronously, and React hooks must be called in the same order.
  useEffect(() => {
    if (user) {
      if (user.country_code) {
        const profileCountry = getCountryByCode(user.country_code);
        if (profileCountry) {
          setShipCountryCode(profileCountry.code);
          writeShippingCountryCode(profileCountry.code);
        }
      } else {
        setShipCountryCode("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!product) {
    if (productsLoading || directProductLoading) {
      return <Loading label={t("loading")} />;
    }

    if (directProductTried) {
      return (
        <main className="main">
          <div className="empty">{t("productNotFound")}</div>
        </main>
      );
    }

    return <Loading label={t("loading")} />;
  }

  const onShipCountryChange = async (event) => {
    const code = event.target.value;
    setShipCountryCode(code);
    writeShippingCountryCode(code);

    if (user?.token && code && user.country_code !== code) {
      const country = getCountryByCode(code);
      try {
        await updateProfile({ country_code: code, country: country?.name || "" });
      } catch (error) {
        console.warn("Unable to update profile country", error);
      }
    }
  };

  const handleAdd = () => {
    if (notAvailableInCountry || isOutOfStock) return;
    addToCart(product.id);
  };

  const handleBuyNow = () => {
    if (notAvailableInCountry || isOutOfStock) return;
    if (needsCountryCheck && !selectedShipCountry) {
      return;
    }
    if (!isInCart) addToCart(product.id);
    navigate("/checkout");
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/store");
    }
  };

  return (
    <main className="main">
      <section className="detail-grid">
        <div className="detail-media">
          <ProductArt product={product} />
          <span className={`badge ${notAvailableInCountry ? "badge-unavailable" : ""}`}>
            {notAvailableInCountry ? t("notAvailableInYourCountry") : availability}
          </span>
        </div>
        <section className="panel">
          <div style={{ marginBottom: 14 }}>
            <button
              className="secondary-btn compact-btn"
              type="button"
              onClick={goBack}
              aria-label={t("back")}
            >
              <span aria-hidden="true" style={{ marginRight: 6 }}>←</span>
              {t("back")}
            </button>
          </div>
          <div>
            <div className="category">{product.category}</div>
            <h1>{product.name}</h1>
          </div>
          <p className="lead">{product.desc}</p>
          <div className="kv">
            <div className="kv-row"><span>{t("price")}</span><strong>{money(product.price, product.currency)}</strong></div>
            <div className="kv-row"><span>{t("availability")}</span><strong>{availability} - {product.stock} {t("units")}</strong></div>
            <div className="kv-row"><span>{t("leadTime")}</span><strong>{product.lead || "—"}</strong></div>
            <div className="kv-row"><span>{t("warranty")}</span><strong>{product.warranty || "—"}</strong></div>
            <div className="kv-row">
              <span>{t("shippingCountries")}</span>
              <strong>{product.ships_worldwide || !shipsToLabel ? t("shipsWorldwide") : shipsToLabel}</strong>
            </div>
          </div>
          <div className="ship-to-check">
            <label>
              {t("checkAvailabilityInCountry")}
              <select className="select" value={shipCountryCode} onChange={onShipCountryChange}>
                <option value="">{t("selectCountryOptional")}</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            {needsCountryCheck && !selectedShipCountry && (
              <div className="country-unavailable-banner" role="alert">
                {t("selectValidCountry")}
              </div>
            )}
            {notAvailableInCountry && (
              <div className="country-unavailable-banner" role="alert">
                {t("notAvailableInYourCountryDetail")
                  .replace("{country}", selectedShipCountry?.name || "")
                  .replace("{product}", product.name)}
              </div>
            )}
            {availabilityCheck?.available === true && selectedShipCountry && !product.ships_worldwide && (
              <div className="country-available-note">
                {t("availableInYourCountry").replace("{country}", selectedShipCountry.name)}
              </div>
            )}
          </div>
          <div className="specs">
            {(product.specs || []).map((spec) => <span className="spec" key={spec}>{spec}</span>)}
          </div>
          {product.long_description && <p className="page-copy">{product.long_description}</p>}
          <div className="card-actions" style={{ marginTop: 18 }}>
            <button
              className="primary-btn"
              disabled={
                isInCart ||
                notAvailableInCountry ||
                isOutOfStock ||
                (needsCountryCheck && !selectedShipCountry)
              }
              onClick={handleAdd}
            >
              {isInCart ? <Check /> : <ShoppingCart />}
              {isInCart
                ? t("inCart")
                : notAvailableInCountry
                ? t("notAvailableInYourCountry")
                : isOutOfStock
                ? t("outOfStock")
                : needsCountryCheck && !selectedShipCountry
                ? t("checkAvailabilityInCountry")
                : t("addToCart")}
            </button>
            <button
              className="secondary-btn"
              type="button"
              disabled={notAvailableInCountry || isOutOfStock || (needsCountryCheck && !selectedShipCountry)}
              onClick={handleBuyNow}
            >
              <FileText />
              {isOutOfStock ? t("outOfStock") : needsCountryCheck && !selectedShipCountry ? t("selectValidCountry") : t("buyNow")}
            </button>
          </div>
          {isInCart && !notAvailableInCountry && (
            <div className="notice" style={{ marginTop: 12, color: "#1c7ed6" }}>
              {t("alreadyInCart")}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
