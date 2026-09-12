import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";
import { currencyOptionLabel } from "../../shared/lib/currency.js";

export default function StorePage() {
  useLocale();
  const { products, productsLoading, displayCurrency, currencies, setCurrency, resetToProductCurrencies } = useStore();
  const allLabel = t("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const currencyMenuRef = useRef(null);
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(6500);
  const categories = useMemo(() => ["all", ...new Set(products.map((item) => item.category))], [products]);
  const priceRangeMax = useMemo(() => {
    const maximum = Math.max(0, ...products.map((product) => Number(product.price || 0)));
    return Math.max(100, Math.ceil(maximum / 100) * 100);
  }, [products]);
  const currencyOptions = useMemo(() => {
    const term = currencyQuery.trim().toLowerCase();
    const list = currencies.length ? currencies : [{ code: "USD", name: "US Dollar", symbol: "$" }];
    if (!term) return list;
    return list.filter((item) => [item.code, item.name, item.symbol].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [currencies, currencyQuery]);

  useEffect(() => {
    // Refreshing rates/currency changes numeric values, so a stale fixed cap
    // must never make the catalogue look empty.
    setMaxPrice(priceRangeMax);
  }, [displayCurrency, priceRangeMax]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!currencyMenuRef.current?.contains(event.target)) setCurrencyMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const selectedCurrency = currencies.find((item) => item.code === displayCurrency);
  const chooseCurrency = (code) => {
    setCurrencyQuery("");
    setCurrencyMenuOpen(false);
    if (code) setCurrency(code);
    else resetToProductCurrencies();
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      // Before country/manual selection, products intentionally retain their
      // own base currencies. A numeric cross-currency price filter is invalid.
      const matchesPrice = !displayCurrency || product.price <= maxPrice;
      const text = [product.name, product.category, product.desc, (product.specs || []).join(" ")].join(" ").toLowerCase();
      return matchesCategory && matchesPrice && text.includes(q);
    });
    if (sort === "priceAsc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, maxPrice, products, query, sort]);

  return (
    <main className="main">
      <Hero
        eyebrow={t("storeTitle")}
        title={t("storeLead")}
        lead={t("storeSubtitle")}
        stats={[
          { value: productsLoading ? "…" : String(products.length), label: t('products') },
          { value: productsLoading ? "…" : String(Math.max(0, categories.length - 1)), label: t('categories') }
        ]}
      />

      <section className="toolbar">
        <input className="input" type="search" placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">{t("sortFeatured")}</option>
          <option value="priceAsc">{t("sortPriceAsc")}</option>
          <option value="priceDesc">{t("sortPriceDesc")}</option>
        </select>
      </section>

      <section className="layout">
        <aside className="filters">
          <div className="field-group store-currency-select">
            <span>{t("currency")}</span>
            <div className="currency-combobox" ref={currencyMenuRef}>
              <button
                type="button"
                className="select currency-combobox-trigger"
                onClick={() => setCurrencyMenuOpen((open) => !open)}
                aria-expanded={currencyMenuOpen}
              >
                <span>{selectedCurrency ? currencyOptionLabel(selectedCurrency) : t("productOriginalCurrency")}</span>
                <span aria-hidden="true">⌄</span>
              </button>
              {currencyMenuOpen ? (
                <div className="currency-combobox-menu">
                  <input
                    className="input currency-search"
                    type="search"
                    autoFocus
                    placeholder={t("searchCurrency")}
                    value={currencyQuery}
                    onChange={(event) => setCurrencyQuery(event.target.value)}
                    aria-label={t("searchCurrency")}
                  />
                  <div className="currency-combobox-options" role="listbox">
                    <button type="button" className="currency-combobox-option" onClick={() => chooseCurrency("")}>{t("productOriginalCurrency")}</button>
                    {currencyOptions.map((item) => (
                      <button type="button" className="currency-combobox-option" key={item.code} onClick={() => chooseCurrency(item.code)}>{currencyOptionLabel(item)}</button>
                    ))}
                    {!currencyOptions.length ? <p className="currency-combobox-empty">{t("noCurrenciesFound")}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {displayCurrency ? (
            <>
              <h2 className="section-title">{t("maxPriceTitle")}</h2>
              <div className="range-row">
                <input type="range" min="0" max={priceRangeMax} step={Math.max(1, Math.ceil(priceRangeMax / 100))} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} />
                <strong>{money(maxPrice, displayCurrency)}</strong>
              </div>
            </>
          ) : null}
          <h2 className="section-title">{t("categoriesTitle")}</h2>
          <div className="filter-list">
            {categories.map((item) => (
              <button className={`filter-chip ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)}>
                <span>{item === "all" ? allLabel : item}</span>
                <span>{item === "all" ? products.length : products.filter((product) => product.category === item).length}</span>
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="products-head">
            <span>{filtered.length} {t("products")}</span>
          </div>
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
            {!filtered.length && <div className="empty">{t("noProductsMatch")}</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
