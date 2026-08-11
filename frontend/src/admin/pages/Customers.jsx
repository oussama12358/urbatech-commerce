import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { money } from "../../shared/lib/format.js";
import { createApiClient } from "../../shared/lib/api.js";
import { useStore } from "../../store/StoreContext.jsx";
import ConfirmDialog from "../../shared/components/ConfirmDialog.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Customers() {
  useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useStore();
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeMenuCustomerId, setActiveMenuCustomerId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [actionBusy, setActionBusy] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);

  const loadCustomers = async (searchValue = "") => {
    if (!user?.token) return;
    setError("");
    setLoading(true);
    try {
      const api = createApiClient(user.token);
      const params = new URLSearchParams();
      if (searchValue.trim()) params.set("search", searchValue.trim());
      const path = `/admin/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const json = await api(path);
      setCustomers(json?.data || []);
    } catch (err) {
      setError(err.message || t("unableToLoadCustomers"));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [user?.token]);

  const filteredCustomers = (() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return customers;

    return customers.filter((customer) => {
      const haystacks = [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return haystacks.some((value) => value.includes(normalizedSearch));
    });
  })();

  useEffect(() => {
    if (!activeMenuCustomerId) return undefined;

    const timer = window.setTimeout(() => {
      setActiveMenuCustomerId(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [activeMenuCustomerId]);

  useEffect(() => {
    const closeMenu = () => setActiveMenuCustomerId(null);
    window.addEventListener("mousedown", closeMenu);
    return () => window.removeEventListener("mousedown", closeMenu);
  }, []);

  useEffect(() => {
    if (!location.state?.customerReactivated) {
      return;
    }

    setSuccessMessage(t("customerReactivated"));
    setSuccessVisible(true);

    const hideTimer = window.setTimeout(() => {
      setSuccessVisible(false);
    }, 2500);

    const clearTimer = window.setTimeout(() => {
      setSuccessMessage("");
      navigate(location.pathname, { replace: true, state: null });
    }, 2900);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [location.pathname, location.state, navigate, t]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const openConfirm = (action, customer) => {
    setActiveMenuCustomerId(null);
    setConfirmAction(action);
    setPendingCustomer(customer);
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setPendingCustomer(null);
    setActionBusy("");
  };

  const handleCustomerAction = async () => {
    if (!pendingCustomer || !confirmAction || !user?.token) return;
    setActionBusy(confirmAction);
    try {
      const api = createApiClient(user.token);
      const path = `/admin/customers/${pendingCustomer.id}/${
        confirmAction === "deactivate" ? "deactivate" : "reactivate"
      }`;
      await api(path, { method: "POST" });
      closeConfirm();
      loadCustomers(search);
    } catch (err) {
      setError(err.message || t("unableToLoadCustomers"));
      setActionBusy("");
    }
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return "";
    if (confirmAction === "deactivate") return t("confirmDeactivateCustomer");
    if (confirmAction === "reactivate") return t("confirmReactivateCustomer");
    return "";
  };

  const getConfirmTitle = () => {
    if (!confirmAction) return t("confirmAction");
    if (confirmAction === "deactivate") return t("deactivateCustomer");
    if (confirmAction === "reactivate") return t("reactivateCustomer");
    return t("confirmAction");
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("crm")}</p>
          <h2>{t("customers")}</h2>
        </div>
      </div>
      <section className="panel">
        <div className="search-panel">
          <div className="form-grid one">
            <label>
              {t("searchPlaceholder")}
              <input
                className="input"
                type="search"
                placeholder={t("searchCustomersPlaceholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className={`success-message ${successVisible ? "visible" : "hidden"}`}>
            {successMessage}
          </div>
        )}

        {filteredCustomers.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("customer")}</th>
                <th>{t("email")}</th>
                <th>{t("phone")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("orders")}</th>
                <th>{t("totalSpent")}</th>
                <th>{t("lastOrder")}</th>
                <th>{t("joined")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const displayName = customer.name?.trim() || customer.email || "-";
                const statusMap = { active: t("active"), archived: t("archived"), deactivated: t("deactivated") };
                const statusText = customer.status ? (statusMap[customer.status] || customer.status) : t("active");
                const statusClass = customer.status === "archived" ? "archived" : customer.status === "deactivated" ? "deactivated" : "active";

                return (
                  <tr key={customer.id || customer.email}>
                    <td className="customer-name-cell" title={displayName}>
                      {displayName}
                    </td>
                    <td>
                      {customer.email ? (
                        <a className="link-button" href={`mailto:${customer.email}`}>
                          {customer.email}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{customer.phone?.trim() || "-"}</td>
                    <td>
                      <span className={`customer-status-pill ${statusClass}`}>{statusText}</span>
                    </td>
                    <td>{customer.orders_count || 0}</td>
                    <td>{money(customer.total_spent_usd || 0, "USD")}</td>
                    <td>{formatDate(customer.last_order_at)}</td>
                    <td>{formatDate(customer.created_at)}</td>
                    <td className="action-cell">
                    <button
                      type="button"
                      className="icon-btn compact-btn"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveMenuCustomerId(
                          activeMenuCustomerId === customer.id ? null : customer.id
                        );
                      }}
                    >
                      ⋮
                    </button>
                    {activeMenuCustomerId === customer.id && (
                      <div className="action-menu" onMouseDown={(event) => event.stopPropagation()}>
                        <Link
                          className="secondary-btn compact-btn action-menu-item"
                          to={`/admin/customers/${customer.id}`}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={() => setActiveMenuCustomerId(null)}
                        >
                          {t("view")}
                        </Link>
                        {customer.status === "deactivated" || customer.status === "archived" ? (
                          <button
                            type="button"
                            className="secondary-btn compact-btn action-menu-item"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={() => openConfirm("reactivate", customer)}
                          >
                            {t("reactivateCustomer")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="secondary-btn compact-btn action-menu-item"
                            onMouseDown={(event) => event.stopPropagation()}
                            onClick={() => openConfirm("deactivate", customer)}
                          >
                            {t("deactivateCustomer")}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : !error ? (
          <div className="empty">{t("noCustomersFound")}</div>
        ) : null}
      </section>

      <ConfirmDialog
        open={Boolean(confirmAction && pendingCustomer)}
        danger={confirmAction !== "reactivate"}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmLabel={actionBusy ? t("loading") : t("confirm")}
        cancelLabel={t("cancel")}
        onCancel={closeConfirm}
        onConfirm={handleCustomerAction}
      />
    </main>
  );
}
