import { useEffect, useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

const label = (value) => {
  const translated = t(`paymentMethod_${value}`);
  return translated === `paymentMethod_${value}`
    ? String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : translated;
};

const providerDescription = (provider) => {
  const key = `paymentProviderDescription_${provider.provider_key}`;
  const translated = t(key);
  return translated === key ? provider.description : translated;
};

export default function PaymentProviders() {
  useLocale();
  const { user, paymentProviders, refreshPaymentProviders, updatePaymentProvider } = useStore();
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    if (user?.token) refreshPaymentProviders().catch((err) => setError(err.message || t("unableToLoadPaymentProviders")));
  }, [user?.token]);

  const toggle = async (provider) => {
    setSavingId(provider.id);
    setError("");
    try {
      await updatePaymentProvider(provider.id, { enabled: !provider.enabled });
      await refreshPaymentProviders();
    } catch (err) {
      setError(err.message || t("providerNeedsIntegration"));
    } finally {
      setSavingId(null);
    }
  };

  return <main className="admin-main">
    <div className="admin-page-head"><div><p className="eyebrow">{t("payments")}</p><h2>{t("paymentProvidersTitle")}</h2></div></div>
    {error && <div className="error-message">{error}</div>}
    <section className="panel" style={{ marginBottom: 16 }}><p>{t("paymentProvidersSecurityNote")}</p></section>
    <section className="panel"><div className="table-responsive"><table className="table"><thead><tr><th>{t("paymentProvider")}</th><th>{t("paymentMethods")}</th><th>{t("merchantStatus")}</th><th>{t("checkout")}</th><th>{t("actions")}</th></tr></thead><tbody>
      {paymentProviders.map((provider) => <tr key={provider.id}><td><strong>{provider.name}</strong><div className="muted">{providerDescription(provider)}</div></td><td>{(provider.enabled_methods || provider.methods || []).map(label).join(", ") || "—"}</td><td>{provider.merchant_eligible ? t("merchantEligible") : t("notVerified")}</td><td>{provider.enabled ? t("enabled") : t("disabled")}{!provider.configured && <div className="muted">{t("credentialsIntegrationMissing")}</div>}</td><td><button className="secondary-btn" type="button" onClick={() => setEditingId(provider.id)}>{t("viewDetails")}</button>{" "}<button className="secondary-btn" type="button" disabled={savingId === provider.id} onClick={() => toggle(provider)}>{provider.enabled ? t("disable") : t("enable")}</button></td></tr>)}
    </tbody></table></div></section>
    {editingId && (() => { const provider = paymentProviders.find((item) => item.id === editingId); return <section className="panel" style={{ marginTop: 16 }}><h2>{provider?.name} — {t("paymentDetails")}</h2><p>{t("paymentDetailsLead")}</p><div className="kv"><div className="kv-row"><span>{t("availableMethods")}</span><strong>{(provider?.methods || []).map(label).join(", ") || "—"}</strong></div><div className="kv-row"><span>{t("currencyEligibility")}</span><strong>{t("checkedBeforeCheckout")}</strong></div><div className="kv-row"><span>{t("merchantIntegration")}</span><strong>{provider?.configured ? t("configuredOnServer") : t("credentialsIntegrationMissing")}</strong></div></div><p className="muted" style={{ marginTop: 14 }}>{t("providerEnableNote")}</p><button className="secondary-btn" type="button" onClick={() => setEditingId("")}>{t("close")}</button></section>; })()}
  </main>;
}
