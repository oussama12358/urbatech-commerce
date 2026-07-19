import { useEffect, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
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

  const load = async () => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    const json = await api("/admin/settlements");
    setSettlements(json.data || []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message || "Unable to load settlements"));
  }, [user?.token]);

  const translateStatus = (status) => {
    if (!status) return "-";
    if (status === "paid") return t("paid");
    if (status === "pending") return t("paymentPending");
    if (status === "denied") return t("paymentDenied");
    if (status === "refunded") return t("refunded");
    if (status === "partially_refunded") return t("partiallyRefunded");
    if (status === "expired") return t("expired");
    return status;
  };

  const markPaid = async (settlement) => {
    const reference = window.prompt(t("payoutReferencePrompt"), settlement.payout_reference || "");
    if (reference === null) return;
    setBusyId(settlement.id);
    setError("");
    try {
      const api = createApiClient(user.token);
      await api(`/admin/settlements/${settlement.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ payment_method: "manual", payout_reference: reference })
      });
      await load();
    } catch (err) {
      setError(err.message || t("unableToMarkSettlementPaid"));
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
            <thead><tr><th>{t("order")}</th><th>{t("supplier")}</th><th>{t("status")}</th><th>{t("amount")}</th><th>{t("commission")}</th><th>{t("reference")}</th><th></th></tr></thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td>{settlement.order_id}</td>
                  <td>{settlement.supplier_id}</td>
                  <td>{translateStatus(settlement.status)}</td>
                  <td>{money(settlement.amount || 0)}</td>
                  <td>{money(settlement.commission_total || 0)}</td>
                  <td>{settlement.payout_reference || "-"}</td>
                  <td>
                    {settlement.status !== "paid" && (
                      <button className="icon-btn" type="button" onClick={() => markPaid(settlement)} disabled={busyId === settlement.id} title={t("markPaid") }>
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
