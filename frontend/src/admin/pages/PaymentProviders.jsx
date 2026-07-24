import { useEffect, useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function PaymentProviders() {
  useLocale();
  const { user, paymentProviders, refreshPaymentProviders, updatePaymentProvider } = useStore();
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    refreshPaymentProviders().catch((err) => setError(err.message || t("unableToLoadPaymentProviders")));
  }, [user?.token]);

  const toggleEnabled = async (provider) => {
    setError("");
    setSavingId(provider.id);
    try {
      await updatePaymentProvider(provider.id, { enabled: !provider.enabled });
      await refreshPaymentProviders();
    } catch (err) {
      setError(err.message || t("unableToUpdateProvider"));
    } finally {
      setSavingId(null);
    }
  };

  const getProviderDescription = (providerKey) => {
    if (providerKey === "paypal") return t("paypalDescription");
    if (providerKey === "stripe") return t("stripeDescription");
    return "";
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("payments")}</p>
          <h2>{t("paymentProvidersTitle")}</h2>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <section className="panel">
        <p>{t("paymentProvidersLead")}</p>
      </section>
      <section className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>{t("displayName")}</th>
                <th>{t("description")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paymentProviders.map((provider) => (
                <tr key={provider.id}>
                  <td title={provider.provider_key} aria-label={`${provider.name} (${provider.provider_key})`}>
                    <div>{provider.name}</div>
                  </td>
                  <td>{getProviderDescription(provider.provider_key)}</td>
                  <td>{provider.enabled ? t("enabled") : t("disabled")}</td>
                  <td>
                    <button
                      className="secondary-btn"
                      type="button"
                      disabled={savingId === provider.id}
                      onClick={() => toggleEnabled(provider)}
                    >
                      {provider.enabled ? t("disable") : t("enable")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
