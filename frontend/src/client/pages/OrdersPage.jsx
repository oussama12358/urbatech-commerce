import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function OrdersPage() {
  useLocale();
  const { orders } = useStore();

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
      <Hero eyebrow={t("orders")} title={t("orderHistory")} lead={t("orderHistoryLead")} />
      <section className="panel">
        {orders.length ? (
          <table className="table">
            <thead><tr><th>{t("order")}</th><th>{t("date")}</th><th>{t("status")}</th><th>{t("carrier")}</th><th>{t("tracking")}</th><th>{t("items")}</th><th>{t("total")}</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="link-button" to={`/orders/${order.id}`}>{order.id}</Link></td>
                  <td>{order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString() : "-")}</td>
                  <td>{translateOrderStatus(order.status)}</td>
                  <td>{order.carrier || "-"}</td>
                  <td>{order.tracking || "-"}</td>
                  <td>{order.items.map((item) => item.name).join(", ")}</td>
                  <td>{money(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">{t("noOrdersYet")}</div>}
      </section>
    </main>
  );
}
