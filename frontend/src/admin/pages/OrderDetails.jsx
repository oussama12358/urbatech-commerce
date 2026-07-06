import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { money } from "../../shared/lib/format.js";
import { createApiClient } from "../../shared/lib/api.js";
import { useStore } from "../../store/StoreContext.jsx";

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    api(`/admin/orders/${id}`)
      .then((json) => setOrder(json.data))
      .catch((err) => setError(err.message || "Unable to load order"));
  }, [id, user?.token]);

  const refreshOrder = async () => {
    const api = createApiClient(user.token);
    const json = await api(`/admin/orders/${id}`);
    setOrder(json.data);
  };

  const refund = async () => {
    if (!user?.token || !order || busy) return;
    if (!window.confirm(`Refund order ${order.id} for ${money(order.total)}?`)) return;
    setBusy(true);
    setActionMessage("");
    setError("");
    try {
      const api = createApiClient(user.token);
      const json = await api(`/admin/orders/${id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin refund" })
      });
      setActionMessage(json.data?.status === "manual_required" ? "Refund recorded for manual processing." : "Refund processed.");
      await refreshOrder();
    } catch (err) {
      setError(err.message || "Unable to refund order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Order details</p>
          <h2>Order #{id}</h2>
        </div>
        <div className="panel-actions">
          {order?.payment_status === "paid" && (
            <button className="secondary-btn danger-icon" type="button" onClick={refund} disabled={busy}>
              {busy ? "Processing..." : "Refund"}
            </button>
          )}
          <Link className="secondary-btn" to="/admin/orders">Back to orders</Link>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {actionMessage && <div className="success-message">{actionMessage}</div>}
      {order ? (
        <section className="two-col">
          <div className="panel">
            <h2>Supplier</h2>
            <div className="kv">
              <div className="kv-row"><span>Supplier</span><strong>{order.supplier_id || "-"}</strong></div>
              <div className="kv-row"><span>Supplier Order</span><strong>{order.supplier_order_id || "-"}</strong></div>
              <div className="kv-row"><span>Tracking</span><strong>{order.tracking || "-"}</strong></div>
              <div className="kv-row"><span>Carrier</span><strong>{order.carrier || "-"}</strong></div>
              <div className="kv-row"><span>Status</span><strong>{order.status}</strong></div>
              <div className="kv-row"><span>Payment</span><strong>{order.payment_status || "-"}</strong></div>
              <div className="kv-row"><span>Supplier payable</span><strong>{money(order.supplier_payable || 0)}</strong></div>
              <div className="kv-row"><span>Product commission</span><strong>{money(order.product_commission || 0)}</strong></div>
              <div className="kv-row"><span>Platform commission</span><strong>{money(order.platform_commission || 0)}</strong></div>
              <div className="kv-row"><span>Dispatch error</span><strong>{order.supplier_dispatch_error || "-"}</strong></div>
            </div>
          </div>
          <div className="panel">
            <h2>Customer</h2>
            <div className="kv">
              <div className="kv-row"><span>Name</span><strong>{order.billing?.customerName || order.billing?.name || "-"}</strong></div>
              <div className="kv-row"><span>Email</span><strong>{order.billing?.customerEmail || order.billing?.email || "-"}</strong></div>
              <div className="kv-row"><span>Phone</span><strong>{order.billing?.phone || "-"}</strong></div>
              <div className="kv-row"><span>Address</span><strong>{order.billing?.address || "-"}</strong></div>
            </div>
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Items</h2>
            <table className="table">
              <thead><tr><th>Product</th><th>Supplier SKU</th><th>Qty</th><th>Unit</th><th>Cost</th><th>Commission</th><th>Total</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td>{item.supplier_product_id || "-"}</td>
                    <td>{item.qty}</td>
                    <td>{money(item.unit_price)}</td>
                    <td>{money(item.cost_price || 0)}</td>
                    <td>{money(item.commission || 0)}</td>
                    <td>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Supplier dispatches</h2>
            {order.supplier_dispatches?.length ? (
              <table className="table">
                <thead><tr><th>Supplier</th><th>Supplier order</th><th>Status</th><th>Carrier</th><th>Tracking</th><th>Invoice</th><th>Payable</th><th>Commission</th></tr></thead>
                <tbody>
                  {order.supplier_dispatches.map((dispatch) => (
                    <tr key={`${dispatch.supplier_id}-${dispatch.supplier_order_id || "pending"}`}>
                      <td>{dispatch.supplier_id || "-"}</td>
                      <td>{dispatch.supplier_order_id || "-"}</td>
                      <td>{dispatch.status || "-"}</td>
                      <td>{dispatch.carrier || "-"}</td>
                      <td>{dispatch.tracking || "-"}</td>
                      <td>{dispatch.invoice_url ? <a className="link-button" href={dispatch.invoice_url} target="_blank" rel="noreferrer">{dispatch.invoice_number || "Open"}</a> : dispatch.invoice_number || "-"}</td>
                      <td>{money(dispatch.supplier_payable || 0)}</td>
                      <td>{money(dispatch.commission_total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">No supplier dispatches yet.</div>
            )}
          </div>
        </section>
      ) : !error ? <div className="empty">Loading order...</div> : null}
    </main>
  );
}
