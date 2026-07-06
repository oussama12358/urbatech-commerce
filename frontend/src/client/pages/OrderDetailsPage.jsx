import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { money } from "../../shared/lib/format.js";

export default function OrderDetailsPage() {
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

  return (
    <main className="main">
      <Hero eyebrow="Order details" title={`Order ${id}`} lead="Delivery status and tracking information." />
      {error && <div className="error-message">{error}</div>}
      {order ? (
        <section className="two-col">
          <div className="panel">
            <h2>Status</h2>
            <div className="kv">
              <div className="kv-row"><span>Order</span><strong>{order.status}</strong></div>
              <div className="kv-row"><span>Payment</span><strong>{order.payment_status || "-"}</strong></div>
              <div className="kv-row"><span>Carrier</span><strong>{order.carrier || "Not available yet"}</strong></div>
              <div className="kv-row"><span>Tracking</span><strong>{order.tracking || "Not available yet"}</strong></div>
              <div className="kv-row"><span>Total</span><strong>{money(order.total)}</strong></div>
            </div>
            <Link className="secondary-btn" to="/orders">Back to orders</Link>
          </div>
          <div className="panel">
            <h2>Items</h2>
            <table className="table">
              <thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead>
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
      ) : !error ? <div className="empty">Loading order...</div> : null}
    </main>
  );
}
