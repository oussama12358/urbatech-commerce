import { Link } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function Orders() {
  useLocale();
  const { orders } = useStore();

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
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("sales")}</p>
          <h2>{t("orders")}</h2>
        </div>
      </div>
      <section className="panel">
        {orders.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("order")}</th>
                <th>{t("status")}</th>
                <th>{t("payment")}</th>
                <th>{t("supplier")}</th>
                <th>{t("supplierOrder")}</th>
                <th>{t("tracking")}</th>
                <th>{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="link-button" to={`/admin/orders/${order.id}`}>{order.id}</Link></td>
                  <td>{translateOrderStatus(order.status)}</td>
                  <td>{translatePaymentStatus(order.payment_status)}</td>
                  <td>{order.supplier_id || "-"}</td>
                  <td>{order.supplier_order_id || "-"}</td>
                  <td>{order.tracking || "-"}</td>
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
