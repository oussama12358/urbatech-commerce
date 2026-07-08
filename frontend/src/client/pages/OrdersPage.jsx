import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";

export default function OrdersPage() {
  const { orders } = useStore();

  return (
    <main className="main">
      <Hero eyebrow="Orders" title="Order history" lead="Track your orders and delivery status." />
      <section className="panel">
        {orders.length ? (
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Carrier</th><th>Tracking</th><th>Items</th><th>Total</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="link-button" to={`/orders/${order.id}`}>{order.id}</Link></td>
                  <td>{order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString() : "-")}</td>
                  <td>{order.status}</td>
                  <td>{order.carrier || "-"}</td>
                  <td>{order.tracking || "-"}</td>
                  <td>{order.items.map((item) => item.name).join(", ")}</td>
                  <td>{money(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">No orders yet.</div>}
      </section>
    </main>
  );
}
