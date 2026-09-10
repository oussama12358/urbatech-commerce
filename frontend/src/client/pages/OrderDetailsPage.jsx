import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function OrderDetailsPage() {
  useLocale();
  const { id } = useParams();
  const { user } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    api(`/orders/${id}`)
      .then((json) => setOrder(json.data))
      .catch((err) => setError(err.message || "Unable to load order"));
  }, [id, user?.token]);

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
  const shipments = Array.isArray(order?.shipments) ? order.shipments : [];
  const hasSinglePackage = shipments.length === 1 && (shipments[0]?.packages?.length || 1) <= 1;

  return (
    <main className="main">
      <Hero eyebrow={t("orderDetailsTitle")} title={`${t("orderNumber")} ${id}`} lead={t("orderDetailsLead")} />
      {error && <div className="error-message">{error}</div>}
      {order ? (
        <section className="two-col">
          <div className="panel">
            <h2>{t("status")}</h2>
            <div className="kv">
              <div className="kv-row"><span>{t("order")}</span><strong>{translateOrderStatus(order.status)}</strong></div>
              <div className="kv-row"><span>{t("payment")}</span><strong>{translatePaymentStatus(order.payment_status)}</strong></div>
              {hasSinglePackage ? <>
                <div className="kv-row"><span>{t("carrier")}</span><strong>{shipments[0]?.carrier || order.carrier || t("notAvailableYet")}</strong></div>
                <div className="kv-row"><span>{t("tracking")}</span><strong>{shipments[0]?.tracking || order.tracking || t("notAvailableYet")}</strong></div>
              </> : <div className="kv-row"><span>{t("shipments")}</span><strong>{shipments.length}</strong></div>}
              <div className="kv-row"><span>{t("total")}</span><strong>{money(order.total, order.currency || "USD")}</strong></div>
            </div>
            {hasSinglePackage && (shipments[0]?.tracking_url || order.tracking_url) ? <a className="primary-btn" href={shipments[0]?.tracking_url || order.tracking_url} target="_blank" rel="noreferrer" style={{ marginBottom: 12 }}>{t("trackMyPackage")}</a> : null}
            <Link className="secondary-btn" to="/orders">{t("backToOrders")}</Link>
          </div>
          <div className="panel">
            <h2>{t("items")}</h2>
            <table className="table">
              <thead><tr><th>{t("product")}</th><th>{t("qty")}</th><th>{t("total")}</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{money(item.total, order.currency || "USD")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shipments.length ? <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>{t("shipments")}</h2>
            {shipments.map((shipment, index) => (
              <div className="kv" key={shipment.id || index} style={{ marginBottom: 16 }}>
                <h3>{t("shipment")} {index + 1}</h3>
                {shipment.items?.length ? <div className="kv-row"><span>{t("items")}</span><strong>{shipment.items.map((item) => `${item.name} × ${item.qty}`).join(", ")}</strong></div> : null}
                {shipment.status ? <div className="kv-row"><span>{t("status")}</span><strong>{translateOrderStatus(shipment.status)}</strong></div> : null}
                {(shipment.packages?.length ? shipment.packages : [shipment]).map((packageRow, packageIndex) => <div className="kv" key={packageRow.id || packageIndex} style={{ marginTop: 10 }}>
                  {shipment.packages?.length > 1 ? <h4>Package {packageIndex + 1}</h4> : null}
                  {packageRow.items?.length && shipment.packages?.length > 1 ? <div className="kv-row"><span>{t("items")}</span><strong>{packageRow.items.map((item) => `${item.name} × ${item.qty}`).join(", ")}</strong></div> : null}
                  {packageRow.status ? <div className="kv-row"><span>{t("status")}</span><strong>{translateOrderStatus(packageRow.status)}</strong></div> : null}
                  <div className="kv-row"><span>{t("carrier")}</span><strong>{packageRow.carrier || t("notAvailableYet")}</strong></div>
                  <div className="kv-row"><span>{t("tracking")}</span><strong>{packageRow.tracking || t("notAvailableYet")}</strong></div>
                  {packageRow.tracking_url ? <a className="secondary-btn" href={packageRow.tracking_url} target="_blank" rel="noreferrer">{t("trackMyPackage")}</a> : null}
                </div>)}
              </div>
            ))}
          </div> : null}
        </section>
      ) : !error ? <div className="empty">{t("loadingOrder")}</div> : null}
    </main>
  );
}
