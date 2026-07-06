import { Link } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";

export default function Orders() {
  const { orders } = useStore();

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Sales</p>
          <h2>Orders</h2>
        </div>
      </div>
      <section className="panel">
        {orders.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Supplier</th>
                <th>Supplier order</th>
                <th>Tracking</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="link-button" to={`/admin/orders/${order.id}`}>{order.id}</Link></td>
                  <td>{order.status}</td>
                  <td>{order.payment_status || "-"}</td>
                  <td>{order.supplier_id || "-"}</td>
                  <td>{order.supplier_order_id || "-"}</td>
                  <td>{order.tracking || "-"}</td>
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
