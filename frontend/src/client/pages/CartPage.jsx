import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import SummaryBox from "../components/SummaryBox.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";
import { showToast } from "../../shared/lib/toast.js";
import { getCountryByCode } from "../../shared/lib/countries.js";
import {
  getProductShipsTo,
  isProductAvailableInCountry,
  readStoredShippingCountryCode,
  subscribeShippingCountry
} from "../../shared/lib/shipping.js";

export default function CartPage() {
  useLocale();
  const { cartLines, changeQty, totals, user, updateProfile, setAutomaticCurrencyForCountry } = useStore();
  const [shipCountryCode, setShipCountryCode] = useState(() => {
    return user?.country_code || readStoredShippingCountryCode();
  });

  useEffect(() => {
    // If an authenticated user exists, prefer their profile country and do not subscribe to guest updates.
    if (user) {
      setShipCountryCode(user.country_code || "");
      return () => {};
    }
    return subscribeShippingCountry(setShipCountryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user?.token || !shipCountryCode || user.country_code === shipCountryCode) {
      return;
    }

    const syncProfileCountry = async () => {
      const country = getCountryByCode(shipCountryCode);
      try {
        await updateProfile({ country_code: shipCountryCode, country: country?.name || "" });
      } catch (error) {
        console.warn("Unable to sync cart country to profile", error);
      }
    };

    syncProfileCountry();
  }, [shipCountryCode, user?.token, user?.country_code, updateProfile]);

  const shipCountry = shipCountryCode ? getCountryByCode(shipCountryCode) : null;
  useEffect(() => {
    if (shipCountryCode) setAutomaticCurrencyForCountry(shipCountryCode);
  }, [shipCountryCode, setAutomaticCurrencyForCountry]);
  const unavailableLines = shipCountry
    ? cartLines.filter((line) => isProductAvailableInCountry(line, shipCountry).available === false)
    : [];
  const restrictedLinesWithoutCountry = !shipCountry
    ? cartLines.filter((line) => getProductShipsTo(line))
    : [];
  const outOfStockLines = cartLines.filter((line) => typeof line.stock === "number" && line.stock <= 0);
  const hasItems = cartLines.length > 0;
  const canCheckout =
    hasItems &&
    unavailableLines.length === 0 &&
    outOfStockLines.length === 0 &&
    restrictedLinesWithoutCountry.length === 0;

  return (
    <main className="main">
      <Hero eyebrow={t("cart")} title={t("cartPageTitle")} lead={t("cartPageLead")} />
      <section className="two-col">
        <div className="panel">
          <h2>{t("cartItems")}</h2>
          {unavailableLines.length > 0 ? (
            <div className="country-unavailable-banner" role="alert" style={{ marginBottom: 12 }}>
              {t("notAvailableInYourCountryBanner").replace("{country}", shipCountry?.name || "")}
            </div>
          ) : restrictedLinesWithoutCountry.length > 0 ? (
            <div className="country-unavailable-banner" role="alert" style={{ marginBottom: 12 }}>
              {t("selectValidCountry")}
            </div>
          ) : null}
            {cartLines.length ? cartLines.map((line) => {
            const unavailable = shipCountry && isProductAvailableInCountry(line, shipCountry).available === false;
            const outOfStock = typeof line.stock === "number" && line.stock <= 0;
            const atLimit = typeof line.stock === "number" && line.qty >= line.stock;
            return (
              <div className={`cart-line ${unavailable || outOfStock ? "cart-line-unavailable" : ""}`} key={line.id}>
                <div className="mini">{line.category.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{line.name}</strong>
                  <p className="desc">
                    {money(line.price, line.currency)} - {line.status}
                    {outOfStock ? ` · ${t("outOfStock")}` : unavailable ? ` · ${t("notAvailableInYourCountry")}` : ""}
                  </p>
                </div>
                <div className="qty">
                  <button onClick={() => changeQty(line.id, -1)}>-</button>
                  <span>{line.qty}</span>
                  <button
                    onClick={() => {
                      if (atLimit) {
                        showToast(t("onlyXLeftInStock").replace("{count}", String(line.stock)), "error");
                        return;
                      }
                      changeQty(line.id, 1);
                    }}
                    aria-disabled={atLimit}
                    className={atLimit ? "disabled" : ""}
                    title={atLimit ? t("onlyXLeftInStock").replace("{count}", String(line.stock)) : ""}
                    tabIndex={atLimit ? -1 : 0}
                  >
                    +
                  </button>
                  {typeof line.stock === "number" && line.stock > 0 ? (
                    <div className="stock-remaining" style={{ fontSize: 12, color: '#9aa3ad', marginLeft: 8 }}>
                      {t("inStock")}: {line.stock}
                    </div>
                  ) : null}
                </div>
                <strong>{money(line.price * line.qty, line.currency)}</strong>
              </div>
            );
          }) : <div className="empty">{t("cartEmpty")}</div>}
        </div>
        <aside className="panel">
          <h2>{t("orderSummary")}</h2>
          <SummaryBox totals={totals} />
          <div className="form-grid" style={{ marginTop: 16 }}>
            {canCheckout ? (
              <Link className="primary-btn" to="/checkout">{t("checkout")}</Link>
            ) : (
              <>
                <button className="primary-btn" type="button" disabled>{t("checkout")}</button>
                <p style={{ marginTop: 8, color: "#c7cdd4", fontSize: 14 }}>
                  {!hasItems
                    ? t("addItemsToCartBeforeCheckout")
                    : t("notAvailableInYourCountryBanner").replace("{country}", shipCountry?.name || "")}
                </p>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
