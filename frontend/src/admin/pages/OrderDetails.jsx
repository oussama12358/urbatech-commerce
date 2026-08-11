import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { money } from "../../shared/lib/format.js";
import { createApiClient } from "../../shared/lib/api.js";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function OrderDetails() {
  useLocale();
  const { id } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [carrierCode, setCarrierCode] = useState("custom");
  const [carrierOptions, setCarrierOptions] = useState([]);
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("Processing");

  useEffect(() => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    api(`/admin/orders/${id}`)
      .then((json) => {
        setOrder(json.data);
        setCarrier(json.data?.carrier || "");
        setCarrierCode(json.data?.carrier_code || "custom");
        setTracking(json.data?.tracking || "");
        setTrackingUrl(json.data?.tracking_url || "");
        setFulfillmentStatus(["Processing", "Shipped", "Delivered"].includes(json.data?.status) ? json.data.status : "Processing");
      })
      .catch((err) => setError(err.message || t("unableToLoadOrder")));
    api("/admin/carriers")
      .then((json) => setCarrierOptions(json.data || []))
      .catch(() => setCarrierOptions([]));
  }, [id, user?.token]);

  const refreshOrder = async () => {
    const api = createApiClient(user.token);
    const json = await api(`/admin/orders/${id}`);
    setOrder(json.data);
    setCarrier(json.data?.carrier || "");
    setCarrierCode(json.data?.carrier_code || "custom");
    setTracking(json.data?.tracking || "");
    setTrackingUrl(json.data?.tracking_url || "");
    setFulfillmentStatus(["Processing", "Shipped", "Delivered"].includes(json.data?.status) ? json.data.status : "Processing");
  };

  const saveFulfillment = async (event) => {
    event.preventDefault();
    if (!user?.token || !order || busy) return;
    setBusy(true);
    setActionMessage("");
    setError("");
    try {
      const api = createApiClient(user.token);
      await api(`/admin/orders/${id}/fulfillment`, {
        method: "PUT",
        body: JSON.stringify({
          carrier: carrierCode === "custom" ? carrier : "",
          carrier_code: carrierCode === "custom" ? "" : carrierCode,
          tracking,
          tracking_url: trackingUrl,
          status: fulfillmentStatus
        })
      });
      setActionMessage("Fulfillment and tracking details saved.");
      await refreshOrder();
    } catch (err) {
      setError(err.message || "Unable to save fulfillment details.");
    } finally {
      setBusy(false);
    }
  };

  const refund = async () => {
    if (!user?.token || !order || busy) return;
    if (!window.confirm(t("refundOrderConfirm").replace("{amount}", money(order.total, order.currency || "USD")))) return;
    setBusy(true);
    setActionMessage("");
    setError("");
    try {
      const api = createApiClient(user.token);
      const json = await api(`/admin/orders/${id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin refund" })
      });
      setActionMessage(json.data?.status === "manual_required" ? t("refundManualRequired") : t("refundProcessed"));
      await refreshOrder();
    } catch (err) {
      setError(err.message || t("unableToRefundOrder"));
    } finally {
      setBusy(false);
    }
  };

  const translatePaymentStatus = (status) => {
    if (!status) return "-";
    if (status === "pending") return t("pending");
    if (status === "Payment pending") return t("paymentPending");
    if (status === "paid" || status === "Paid") return t("paid");
    if (status === "denied" || status === "Payment denied") return t("paymentDenied");
    if (status === "refunded" || status === "Refunded") return t("refunded");
    if (status === "partially_refunded" || status === "Partially refunded") return t("partiallyRefunded");
    if (status === "expired" || status === "Expired") return t("expired");
    return status;
  };

  const translateOrderStatus = (status) => {
    if (!status) return "-";
    if (status === "Payment pending") return t("paymentPending");
    if (status === "Paid") return t("paid");
    if (status === "Payment denied") return t("paymentDenied");
    if (status === "Refunded") return t("refunded");
    if (status === "Partially refunded") return t("partiallyRefunded");
    if (status === "Expired") return t("expired");
    return status;
  };

  const isUrbaTechStockOrder = Boolean(
    order?.items?.length && order.items.every((item) => !item.supplier_id)
  );

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("orderDetailsTitle")}</p>
          <h2>{t("orderNumber")} #{id}</h2>
        </div>
        <div className="panel-actions">
          {order?.payment_status === "paid" && (
            <button className="secondary-btn danger-icon" type="button" onClick={refund} disabled={busy}>
              {busy ? t("processing") : t("refund")}
            </button>
          )}
          <Link className="secondary-btn" to="/admin/orders">{t("backToOrders")}</Link>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {actionMessage && <div className="success-message">{actionMessage}</div>}
      {order ? (
        <section className="two-col">
          <div className="panel">
            <h2>{t("supplier")}</h2>
            <div className="kv">
              <div className="kv-row"><span>{t("supplier")}</span><strong>{isUrbaTechStockOrder ? "URBA TECH stock" : order.supplier_id || "-"}</strong></div>
              <div className="kv-row"><span>{t("supplierOrder")}</span><strong>{isUrbaTechStockOrder ? "URBA TECH stock" : order.supplier_order_id || "-"}</strong></div>
              <div className="kv-row"><span>{t("tracking")}</span><strong>{order.tracking || "-"}</strong></div>
              <div className="kv-row"><span>{t("carrier")}</span><strong>{order.carrier || "-"}</strong></div>
              <div className="kv-row"><span>{t("status")}</span><strong>{translateOrderStatus(order.status)}</strong></div>
              <div className="kv-row"><span>{t("payment")}</span><strong>{translatePaymentStatus(order.payment_status)}</strong></div>
              <div className="kv-row"><span>{t("supplierPayable")}</span><strong>{isUrbaTechStockOrder ? "URBA TECH stock" : money(order.supplier_payable || 0, order.currency || "USD")}</strong></div>
              <div className="kv-row"><span>{t("grossProfit")}</span><strong>{money(order.gross_profit || 0, order.currency || "USD")}</strong></div>
              <div className="kv-row"><span>{t("dispatchError")}</span><strong>{order.supplier_dispatch_error || "-"}</strong></div>
            </div>
          </div>
          <form className="panel form-grid" onSubmit={saveFulfillment}>
            <div>
              <h2>Manual fulfillment</h2>
              <p className="page-copy">For URBA TECH stock and Excel/CSV suppliers. API suppliers can continue updating tracking automatically.</p>
            </div>
            <label className="field-group">
              <span>{t("carrier")}</span>
              <select className="select" value={carrierCode} onChange={(event) => { setCarrierCode(event.target.value); setTrackingUrl(""); }}>
                <option value="custom">Other / custom carrier</option>
                {carrierOptions.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
              </select>
            </label>
            {carrierCode === "custom" ? <label className="field-group"><span>Carrier name</span><input className="input" value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="DHL, Aramex, La Poste…" /></label> : null}
            <label className="field-group">
              <span>{t("tracking")}</span>
              <input className="input" value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Tracking number" />
            </label>
            <label className="field-group">
              <span>Custom tracking URL (optional)</span>
              <input className="input" type="url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} placeholder="https://…" />
            </label>
            <label className="field-group">
              <span>{t("status")}</span>
              <select className="select" value={fulfillmentStatus} onChange={(event) => setFulfillmentStatus(event.target.value)}>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </label>
            <button className="primary-btn" type="submit" disabled={busy}>{busy ? t("processing") : "Save fulfillment"}</button>
          </form>
          <div className="panel">
            <h2>{t("customer")}</h2>
            <div className="kv">
              <div className="kv-row"><span>{t("name")}</span><strong>{order.billing?.customerName || order.billing?.name || "-"}</strong></div>
              <div className="kv-row"><span>{t("email")}</span><strong>{order.billing?.customerEmail || order.billing?.email || "-"}</strong></div>
              <div className="kv-row"><span>{t("phone")}</span><strong>{order.billing?.phone || "-"}</strong></div>
              <div className="kv-row"><span>{t("address")}</span><strong>{order.billing?.address || "-"}</strong></div>
            </div>
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>{t("items")}</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("product")}</th>
                  <th>{t("supplierSku")}</th>
                  <th>{t("qty")}</th>
                  <th>{t("unit")}</th>
                  <th>{t("cost")}</th>
                  <th>{t("grossProfit")}</th>
                  <th>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td>{item.supplier_product_id || "-"}</td>
                    <td>{item.qty}</td>
                    <td>{money(item.unit_price, order.currency || "USD")}</td>
                    <td>{money(item.cost_price || 0, order.currency || "USD")}</td>
                    <td>{money(item.gross_profit || 0, order.currency || "USD")}</td>
                    <td>{money(item.total, order.currency || "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>{t("supplierDispatches")}</h2>
            {order.supplier_dispatches?.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("supplier")}</th>
                    <th>{t("supplierOrder")}</th>
                    <th>{t("status")}</th>
                    <th>{t("carrier")}</th>
                    <th>{t("tracking")}</th>
                    <th>{t("invoice")}</th>
                    <th>{t("payable")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.supplier_dispatches.map((dispatch) => (
                    <tr key={`${dispatch.supplier_id}-${dispatch.supplier_order_id || "pending"}`}>
                      <td>{dispatch.supplier_id || "-"}</td>
                      <td>{dispatch.supplier_order_id || "-"}</td>
                      <td>{dispatch.status || "-"}</td>
                      <td>{dispatch.carrier || "-"}</td>
                      <td>{dispatch.tracking || "-"}</td>
                      <td>{dispatch.invoice_url ? <a className="link-button" href={dispatch.invoice_url} target="_blank" rel="noreferrer">{dispatch.invoice_number || t("open")}</a> : dispatch.invoice_number || "-"}</td>
                      <td>{money(dispatch.supplier_payable || 0, order.currency || "USD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">{t("noSupplierDispatchesYet")}</div>
            )}
          </div>
        </section>
      ) : !error ? <div className="empty">{t("loadingOrder")}</div> : null}
    </main>
  );
}
