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
              <div className="kv-row"><span>{t("carrier")}</span><strong>{order.carrier || t("notAvailableYet")}</strong></div>
              <div className="kv-row"><span>{t("tracking")}</span><strong>{order.tracking || t("notAvailableYet")}</strong></div>
              <div className="kv-row"><span>{t("total")}</span><strong>{money(order.total)}</strong></div>
            </div>
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
                    <td>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : !error ? <div className="empty">{t("loadingOrder")}</div> : null}
    </main>
  );
}
