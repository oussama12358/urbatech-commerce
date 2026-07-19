import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import SummaryBox from "../components/SummaryBox.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";
import { money } from "../../shared/lib/format.js";
import { showToast } from "../../shared/lib/toast.js";
import COUNTRIES, { PHONE_DATA, DIAL_CODES, getCountryByCode } from "../../shared/lib/countries.js";
import { searchCities } from "../../shared/lib/cities.js";

function CountryFlagImage({ src, alt }) {
  return <img className="country-flag-img" src={src} alt={alt} loading="lazy" />;
}

function CountryAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const prevValueRef = useRef(value);

  // Sync query when value changes externally (e.g. clear)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      if (value) setQuery(value.name);
      else setQuery("");
    }
  }, [value]);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = useCallback((country) => {
    onChange(country);
    setQuery(country.name);
    setOpen(false);
  }, [onChange]);

  const blurTimerRef = useRef(null);

  return (
    <div className="country-autocomplete" ref={ref}>
      <div className="country-input-wrap">
        {value && query === value.name && <CountryFlagImage src={value.flagSrc} alt={value.code} />}
        <input
          className="input country-input"
          placeholder={t("country")}
          value={query}
          required
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val) {
              setOpen(true);
              if (value && val !== value.name) onChange(null);
            } else {
              setOpen(false);
              onChange(null);
            }
          }}
          onBlur={() => {
            blurTimerRef.current = setTimeout(() => {
              if (!value) setQuery("");
            }, 300);
          }}
          onFocus={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
            // Show all countries on focus when nothing selected
            if (!value) setQuery("");
            setOpen(true);
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="country-dropdown">
          {filtered.map((c) => (
            <div
              key={c.code}
              className={`country-option ${value?.code === c.code ? "active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevents onBlur from firing before selection
                select(c);
              }}
            >
              <CountryFlagImage src={c.flagSrc} alt={c.code} />
              <span className="country-name">{c.name}</span>
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div className="country-dropdown">
          <div className="country-option no-result">{t("notFound").replace("{query}", query)}</div>
        </div>
      )}
    </div>
  );
}

function formatPhone(value, format) {
  const digits = value.replace(/\D/g, "");
  if (!format || !digits) return digits;
  // Get group sizes from format: "XX XXX XXX" → [2,3,3]
  const groups = format.split(" ").map((g) => g.replace(/[^X]/g, "").length);
  let result = [];
  let pos = 0;
  for (const size of groups) {
    if (pos >= digits.length) break;
    result.push(digits.slice(pos, pos + size));
    pos += size;
  }
  return result.join(" ");
}

function CitySearch({ countryCode, value, onChange, onCountryChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const cityChangingRef = useRef(false);

  const filtered = useMemo(() => {
    if (!query) return [];
    return searchCities(query, countryCode);
  }, [query, countryCode]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // When country changes from outside, reset city. But if WE triggered the country change, ignore.
  useEffect(() => {
    if (cityChangingRef.current) {
      cityChangingRef.current = false;
      return;
    }
    setQuery("");
    onChange("");
  }, [countryCode]);

  const select = useCallback((city, code) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
    if (code && onCountryChange) {
      const country = getCountryByCode(code);
      if (country) {
        cityChangingRef.current = true;
        onCountryChange(country);
      }
    }
  }, [onChange, onCountryChange]);

  return (
    <div className="country-autocomplete" ref={ref}>
      <div className="country-input-wrap">
        <input
          className="input country-input"
          name="city"
          placeholder={t("searchCityPlaceholder")}
          value={value || query}
          required
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val) { setOpen(true); if (value && val !== value) onChange(""); }
            else { setOpen(false); onChange(""); }
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!value) setQuery("");
            }, 200);
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="country-dropdown">
          {filtered.map((c, i) => (
            <div key={c.city + c.code + i} className={`country-option ${value === c.city ? "active" : ""}`} onClick={() => select(c.city, c.code)}>
              {(() => { const cnt = getCountryByCode(c.code); return cnt ? <CountryFlagImage src={cnt.flagSrc} alt={cnt.code} /> : null; })()}
              <span className="country-name">{c.city}, <small>{getCountryByCode(c.code)?.name || c.code}</small></span>
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div className="country-dropdown">
          <div className="country-option no-result">{t("notFound").replace("{query}", query)}</div>
        </div>
      )}
    </div>
  );
}

function PhoneInput({ phoneCode, phoneFormat, onCodeChange, name }) {
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const cursorRef = useRef(0);
  const current = PHONE_DATA.find((p) => p.dial === phoneCode) || null;

  // Reset when format changes
  useEffect(() => {
    setDisplayValue("");
  }, [phoneCode, phoneFormat]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = formatPhone(raw, phoneFormat);
    setDisplayValue(formatted);
    // Store raw digits for form submission
    e.target._rawValue = raw;
  };

  const handleKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className="phone-input-wrapper" ref={ref}>
      <div className="phone-code-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="phone-trigger-flag">
          {current ? <CountryFlagImage src={current.flagSrc} alt={current.code} /> : null}
        </span>
        <span className="phone-trigger-dial">{current?.dial || t("countryCodePlaceholder")}</span>
        <span className="phone-trigger-arrow">▼</span>
      </div>
      {open && (
        <div className="country-dropdown phone-dropdown">
          {PHONE_DATA.map((p) => (
            <div
              key={p.code}
              className={`country-option ${current?.code === p.code ? "active" : ""}`}
              onClick={() => {
                onCodeChange(p.dial);
                setOpen(false);
              }}
            >
              <CountryFlagImage src={p.flagSrc} alt={p.code} />
              <span className="country-name">{p.dial} {p.name}</span>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        className="input phone-number-input"
        name={name || "phoneNumber"}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
          placeholder={t("phoneNumberPlaceholder")}
        value={displayValue}
        required
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={() => {
          const raw = displayValue.replace(/\D/g, "");
          const expectedDigits = phoneFormat ? phoneFormat.split(" ").reduce((sum, g) => sum + g.replace(/[^X]/g, "").length, 0) : 0;
          if (raw && expectedDigits > 0 && raw.length < expectedDigits) {
            setDisplayValue("");
          }
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  useLocale();
  const { user, cartLines, totals, clearCart, createOrder, createCheckoutSession, paymentProviders } = useStore();

  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneFormat, setPhoneFormat] = useState("");
  const redirectedRef = useRef(false);
  const enabledPaymentProviders = paymentProviders.filter((provider) => provider.enabled);

  useEffect(() => {
    if (!cartLines.length && !redirectedRef.current) {
      redirectedRef.current = true;
      showToast(t("cartEmptyContinueShopping"), "error");
      navigate("/store", { replace: true });
    }
  }, [cartLines.length, navigate]);

  useEffect(() => {
    if (!enabledPaymentProviders.length) {
      setPaymentMethod("");
      return;
    }
    const hasSelected = enabledPaymentProviders.some((provider) => provider.provider_key === paymentMethod);
    if (!hasSelected) {
      setPaymentMethod(enabledPaymentProviders[0].provider_key);
    }
  }, [enabledPaymentProviders, paymentMethod]);

  // When country changes, auto-update phone code & format, or reset if null
  useEffect(() => {
    if (selectedCountry) {
      const dial = DIAL_CODES[selectedCountry.code];
      if (dial) setPhoneCode(dial);
      if (selectedCountry.phoneFormat) setPhoneFormat(selectedCountry.phoneFormat);
    } else {
      setPhoneCode("");
      setPhoneFormat("");
    }
  }, [selectedCountry]);

  // When phone code changes directly (from PhoneInput dropdown), update format & sync country
  useEffect(() => {
    const found = PHONE_DATA.find((p) => p.dial === phoneCode);
    if (found) {
      if (found.phoneFormat) setPhoneFormat(found.phoneFormat);
      // Sync country: find countries that share this dial code
      const matching = COUNTRIES.filter((c) => DIAL_CODES[c.code] === phoneCode);
      // If exactly one match, auto-update country (like Stripe/Shopify do)
      if (matching.length === 1 && selectedCountry?.code !== matching[0].code) {
        setSelectedCountry(matching[0]);
      }
    }
  }, [phoneCode]);

  const submit = async (event) => {
    event.preventDefault();
    if (!cartLines.length) {
      showToast(t("cartEmptyContinueShopping"), "error");
      navigate("/store");
      return;
    }

    // Validate country - must be selected from list
    if (!selectedCountry) {
      showToast(t("selectValidCountry"), "error");
      return;
    }

    // Validate city - must be selected from list
    if (!selectedCity || !searchCities(selectedCity, selectedCountry?.code).some(c => c.city === selectedCity && c.code === selectedCountry?.code)) {
      showToast(t("selectValidCity"), "error");
      return;
    }

    // Validate phone - digit count based on country format
    const formValues = Object.fromEntries(new FormData(event.currentTarget));
    const phoneDigits = formValues.phoneNumber ? formValues.phoneNumber.replace(/\D/g, "") : "";
    const expectedDigits = phoneFormat ? phoneFormat.split(" ").reduce((sum, g) => sum + g.replace(/[^X]/g, "").length, 0) : 0;
    if (!phoneDigits || (expectedDigits > 0 && phoneDigits.length < expectedDigits)) {
      showToast(t("pleaseEnterCompletePhone"), "error");
      return;
    }

    const billing = {
      ...formValues,
      city: selectedCity,
      country: selectedCountry?.name,
      customerName: `${formValues.firstName || ""} ${formValues.lastName || ""}`.trim() || user?.name,
      customerEmail: user?.email || formValues.email,
      phone: `${phoneCode} ${phoneDigits}`.trim()
    };

    try {
      const order = await createOrder(billing, { clearCartAfterCreate: false });
      const response = await createCheckoutSession(order.id, paymentMethod);
      if (response.url) {
        clearCart();
        window.location.assign(response.url);
      } else if (response.redirectUrl) {
        clearCart();
        window.location.assign(response.redirectUrl);
      }
    } catch (err) {
      console.error(err);
        const fallback = t("paymentUnavailable");
        showToast(err.message && typeof err.message === "string" ? err.message : fallback, "error");
        navigate("/checkout", { replace: true });
    }
  };

  return (
    <main className="main">
      <Hero eyebrow={t("checkout")} title={t("completePurchase")} lead={t("checkoutLead")} />
      <section className="two-col">
        <form className="panel form-grid" onSubmit={submit}>
          <h2>{t("billingInformation")}</h2>
          <div className="form-grid two">
            <label>
              {t("firstName")} *
              <input className="input" name="firstName" placeholder={t("firstName")} defaultValue={user?.name?.split(" ")[0] || ""} required />
            </label>
            <label>
              {t("lastName")} *
              <input className="input" name="lastName" placeholder={t("lastName")} required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              {t("email")} *
              <input className="input" name="email" type="email" defaultValue={user?.email || ""} placeholder="email@example.com" required />
            </label>
            <label>
              {t("phone")} *
              <PhoneInput
                phoneCode={phoneCode}
                phoneFormat={phoneFormat}
                onCodeChange={setPhoneCode}
                name="phoneNumber"
              />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              {t("country")} *
              <CountryAutocomplete value={selectedCountry} onChange={setSelectedCountry} />
            </label>
            <label>
              {t("city")} *
              <CitySearch countryCode={selectedCountry?.code} value={selectedCity} onChange={setSelectedCity} onCountryChange={setSelectedCountry} />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              {t("postalCode")} *
              <input className="input" name="postalCode" placeholder={t("postalCode")} required />
            </label>
            <label>
              {t("address")} *
              <input className="input" name="address" placeholder={t("address")} required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              {t("apartmentOptional")}
              <input className="input" name="apartment" placeholder={t("apartmentOptional")} />
            </label>
            <div />
          </div>
          <label>
            {t("orderNotesOptional")}
            <textarea className="input" name="notes" rows={4} placeholder={t("deliveryInstructionsPlaceholder")} />
          </label>

          <div className="payment-panel">
            <div>
              <label htmlFor="paymentMethod">{t("paymentMethod")}</label>
              {enabledPaymentProviders.length ? (
                <>
                  <select
                    id="paymentMethod"
                    className="select"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    required
                  >
                    {enabledPaymentProviders.map((provider) => (
                      <option key={provider.provider_key} value={provider.provider_key}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <p className="payment-hint">{t("redirectToPayment")}</p>
                  <div className="payment-logos">
                    {enabledPaymentProviders.map((provider) => (
                      <span key={provider.provider_key} className="payment-badge">
                        {provider.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="payment-warning">
                  <p>⚠ {t("noPaymentMethodsAvailable")}</p>
                  <p>{t("contactSupportOrTryLater")}</p>
                </div>
              )}
            </div>
            <div className="checkout-actions">
              <div className="checkout-paystack">
                <button
                  className="primary-btn full-width"
                  type="submit"
                  disabled={!enabledPaymentProviders.length}
                >
                  {t("pay")} {enabledPaymentProviders.length ? money(totals.total) : ""}
                </button>
                <span className="pay-lock-badge">{t("totalSecured")}</span>
              </div>
              <Link className="secondary-btn full-width" to="/cart">
                {t("backToCart")}
              </Link>
            </div>
          </div>
        </form>

        <aside className="panel summary-panel">
          <div className="summary-header">
            <div>
              <h2>{t("orderSummary")}</h2>
              <p>{cartLines.length} {cartLines.length === 1 ? t("item") : t("items")}</p>
            </div>
            <div className="summary-trust">
              <span>{t("securePayment")}</span>
            </div>
          </div>
          <div className="summary-items">
            {cartLines.map((item) => (
              <div key={item.id} className="summary-item">
                <span>{item.name}</span>
                <span>{item.qty} × {money(item.price)}</span>
                <strong>{money(item.qty * item.price)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-meta">
            <span>{t("estimatedDelivery")}</span>
            <strong>{t("businessDays")}</strong>
          </div>
          <SummaryBox totals={totals} />
          {enabledPaymentProviders.length ? (
            <div className="summary-supported">
              <span className="summary-supported-label">{t("acceptedPaymentMethods")}</span>
              <div className="payment-logos summary-payment-logos">
                {enabledPaymentProviders.map((provider) => (
                  <span key={provider.provider_key} className="payment-badge">
                    {provider.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="summary-note">{t("allTotalsInclude")}</p>
          <p className="summary-help">{t("summaryHelp")}</p>
        </aside>
      </section>
    </main>
  );
}