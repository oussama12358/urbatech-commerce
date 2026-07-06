import { useEffect, useState } from "react";
import { createApiClient } from "../../shared/lib/api.js";
import { useStore } from "../../store/StoreContext.jsx";

export default function Customers() {
  const { user } = useStore();
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    const api = createApiClient(user.token);
    api("/admin/customers")
      .then((json) => setCustomers(json?.data || []))
      .catch((err) => setError(err.message || "Unable to load customers"));
  }, [user?.token]);

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">CRM</p>
          <h2>Customers</h2>
        </div>
      </div>
      <section className="panel">
        {error && <div className="error-message">{error}</div>}
        {customers.length ? (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id || customer.email}>
                  <td>{customer.name || "-"}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !error ? <div className="empty">No customers found.</div> : null}
      </section>
    </main>
  );
}
