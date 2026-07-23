import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { money } from "../../shared/lib/format.js";
import { createApiClient } from "../../shared/lib/api.js";
import { useStore } from "../../store/StoreContext.jsx";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { t, useLocale } from "../../i18n.js";

export default function CustomerDetails() {
  useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useStore();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    const loadCustomer = async () => {
      setLoading(true);
      setError("");
      try {
        const api = createApiClient(user.token);
        const json = await api(`/admin/customers/${id}`);
        setCustomer(json?.data || null);
      } catch (err) {
        setError(err.message || t("unableToLoadCustomers"));
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id, user?.token]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const displayName = customer?.name?.trim() || customer?.email || "-";

  const savedAddress = [customer?.address, customer?.city, customer?.postalCode, customer?.country]
    .filter(Boolean)
    .join(", ");

  const reactivateCustomer = async () => {
    if (!customer?.id || !user?.token) return;
    setBusyAction("reactivate");
    try {
      const api = createApiClient(user.token);
      await api(`/admin/customers/${customer.id}/reactivate`, { method: "POST" });
      const refreshed = await api(`/admin/customers/${customer.id}`);
      setCustomer(refreshed?.data || null);
      setBusyAction("");
      setConfirmOpen(false);
      navigate("/admin/customers", { state: { customerReactivated: true } });
    } catch (err) {
      setError(err.message || t("unableToLoadCustomers"));
      setBusyAction("");
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("crm")}</p>
          <h2>{t("customerDetails")}</h2>
        </div>
        <div className="panel-actions">
          <Link className="secondary-btn" to="/admin/customers">
            {t("backToCustomers")}
          </Link>
          {customer?.status && customer.status !== "active" ? (
            <button className="primary-btn" type="button" disabled={busyAction === "reactivate"} onClick={() => setConfirmOpen(true)}>
              {busyAction === "reactivate" ? t("loading") : t("reactivateCustomer")}
            </button>
          ) : null}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="empty">{t("loading")}</div>
      ) : customer ? (
        <section className="two-col">
          <div className="panel">
            <h2>{displayName}</h2>
            <div className="kv">
              <div className="kv-row"><span>{t("name")}</span><strong>{displayName}</strong></div>
              <div className="kv-row"><span>{t("email")}</span><strong>{customer.email || "-"}</strong></div>
              <div className="kv-row"><span>{t("phone")}</span><strong>{customer.phone?.trim() || "-"}</strong></div>
              <div className="kv-row"><span>{t("status")}</span><strong>{customer.status || "active"}</strong></div>
              <div className="kv-row"><span>{t("address")}</span><strong>{savedAddress || "-"}</strong></div>
              <div className="kv-row"><span>{t("joined")}</span><strong>{formatDate(customer.created_at)}</strong></div>
              <div className="kv-row"><span>{t("orders")}</span><strong>{customer.orders_count || 0}</strong></div>
              <div className="kv-row"><span>{t("totalSpent")}</span><strong>{money(customer.total_spent || 0)}</strong></div>
              <div className="kv-row"><span>{t("lastOrder")}</span><strong>{formatDate(customer.last_order_at)}</strong></div>
            </div>
          </div>

          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>{t("orderHistory")}</h2>
            {customer.orders?.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("order")}</th>
                    <th>{t("status")}</th>
                    <th>{t("payment")}</th>
                    <th>{t("total")}</th>
                    <th>{t("createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td><Link className="link-button" to={`/admin/orders/${order.id}`}>{order.id}</Link></td>
                      <td>{order.status || "-"}</td>
                      <td>{order.payment_status || "-"}</td>
                      <td>{money(order.total)}</td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">{t("noOrdersYet")}</div>
            )}
          </div>

          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>{t("addresses")}</h2>
            {customer.addresses?.length ? (
              <ul className="simple-list">
                {customer.addresses.map((address, index) => (
                  <li key={`${address}-${index}`}>{address}</li>
                ))}
              </ul>
            ) : (
              <div className="empty">{t("noSavedAddresses")}</div>
            )}
          </div>
        </section>
      ) : !error ? (
        <div className="empty">{t("noCustomersFound")}</div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t("reactivateCustomer")}
        message={t("confirmReactivateCustomer")}
        confirmLabel={busyAction === "reactivate" ? t("loading") : t("confirm")}
        cancelLabel={t("cancel")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={reactivateCustomer}
      />
    </main>
  );
}
