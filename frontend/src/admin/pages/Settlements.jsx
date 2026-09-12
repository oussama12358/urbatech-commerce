import { useEffect, useState } from "react";
import { BadgeDollarSign, RefreshCw } from "lucide-react";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Settlements() {
  useLocale();
  const { user } = useStore();
  const [settlements, setSettlements] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const interpolate = (key, values) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, String(value)), t(key));

  const load = async () => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    const json = await api("/admin/settlements");
    setSettlements(json.data || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message || t("unableToLoadSettlements")));
  }, [user?.token]);

  const translateStatus = (status) => {
    if (!status) return "-";
    if (status === "paid") return t("paid");
    if (status === "pending") return t("paymentPending");
    if (status === "processing") return t("statusProcessing");
    if (status === "denied") return t("paymentDenied");
    if (status === "refunded") return t("refunded");
    if (status === "partially_refunded") return t("partiallyRefunded");
    if (status === "expired") return t("expired");
    return status;
  };

  const markPaid = async (settlement) => {
    const method = settlement.payout_method || "manual";
    const automatic = method === "stripe_connect" || method === "paypal_payout";
    const amount = money(settlement.amount || 0, settlement.currency);
    if (automatic && !window.confirm(interpolate("confirmAutomaticPayout", { amount, method: method === "stripe_connect" ? "Stripe Connect" : "PayPal Payouts" }))) return;
    if (!automatic && !window.confirm(interpolate("confirmManualPayout", { amount }))) return;
    const reference = automatic ? "" : window.prompt(t("payoutReferencePrompt"), settlement.payout_reference || "");
    if (reference === null) return;
    let paidAmount;
    let paidCurrency;
    if (!automatic && window.confirm(interpolate("confirmDifferentPayoutCurrency", { currency: settlement.currency || "USD" }))) {
      paidAmount = window.prompt(t("actualAmountSent"), "");
      if (paidAmount === null) return;
      paidCurrency = window.prompt(t("actualPaymentCurrency"), "");
      if (paidCurrency === null) return;
      if (!paidAmount.trim() || !paidCurrency.trim()) {
        setError(t("actualPayoutAmountCurrencyRequired"));
        return;
      }
    }
    setBusyId(settlement.id);
    setError("");
    try {
      const api = createApiClient(user.token);
      await api(`/admin/settlements/${settlement.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ payment_method: method, payout_reference: reference, ...(paidAmount ? { paid_amount: Number(paidAmount), paid_currency: paidCurrency.trim().toUpperCase() } : {}) })
      });
      await load();
    } catch (err) {
      setError(err.message || t("unableToMarkSettlementPaid"));
    } finally {
      setBusyId("");
    }
  };

  const reconcilePayPal = async (settlement) => {
    setBusyId(settlement.id);
    setError("");
    try {
      const api = createApiClient(user.token);
      await api(`/admin/settlements/${settlement.id}/reconcile`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err.message || t("unableToCheckPayPalPayoutStatus"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("supplierPayouts")}</p>
          <h2>{t("settlements")}</h2>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <section className="panel">
        {settlements.length ? (
          <table className="table">
            <thead><tr><th>{t("order")}</th><th>{t("supplier")}</th><th>{t("status")}</th><th>{t("amount")}</th><th>{t("currency")}</th><th>{t("payoutMethod")}</th><th>{t("reference")}</th><th></th></tr></thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td>{settlement.order_id}</td>
                  <td>{settlement.supplier_id}</td>
                  <td>{translateStatus(settlement.status)}</td>
                  <td>{money(settlement.amount || 0, settlement.currency)}</td>
                  <td>{settlement.currency || "USD"}</td>
                  <td>{(settlement.payout_method || "manual").replaceAll("_", " ")}</td>
                  <td>{settlement.payout_reference || "-"}</td>
                  <td>
                    {settlement.status === "processing" && settlement.payout_method === "paypal_payout" && (
                      <button className="icon-btn" type="button" onClick={() => reconcilePayPal(settlement)} disabled={busyId === settlement.id} title={t("checkPayPalPayoutStatus")}>
                        <RefreshCw />
                      </button>
                    )}
                    {settlement.status === "pending" && (
                      <button className="icon-btn" type="button" onClick={() => markPaid(settlement)} disabled={busyId === settlement.id} title={settlement.payout_method === "stripe_connect" ? t("payWithStripeConnect") : settlement.payout_method === "paypal_payout" ? t("payWithPayPalPayouts") : t("markPaid") }>
                        <BadgeDollarSign />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">{t("noSupplierSettlementsYet")}</div>
        )}
      </section>
    </main>
  );
}
