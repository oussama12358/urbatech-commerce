import { useEffect, useState } from "react";
import { BadgeDollarSign } from "lucide-react";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { useStore } from "../../store/StoreContext.jsx";

export default function Settlements() {
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

  const markPaid = async (settlement) => {
    const reference = window.prompt("Payout reference", settlement.payout_reference || "");
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
      setError(err.message || "Unable to mark settlement paid");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Supplier payouts</p>
          <h2>Settlements</h2>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <section className="panel">
        {settlements.length ? (
          <table className="table">
            <thead><tr><th>Order</th><th>Supplier</th><th>Status</th><th>Amount</th><th>Commission</th><th>Reference</th><th></th></tr></thead>
            <tbody>
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td>{settlement.order_id}</td>
                  <td>{settlement.supplier_id}</td>
                  <td>{settlement.status}</td>
                  <td>{money(settlement.amount || 0)}</td>
                  <td>{money(settlement.commission_total || 0)}</td>
                  <td>{settlement.payout_reference || "-"}</td>
                  <td>
                    {settlement.status !== "paid" && (
                      <button className="icon-btn" type="button" onClick={() => markPaid(settlement)} disabled={busyId === settlement.id} title="Mark paid">
                        <BadgeDollarSign />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No supplier settlements yet.</div>
        )}
      </section>
    </main>
  );
}
