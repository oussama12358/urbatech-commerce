import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import SummaryBox from "../components/SummaryBox.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";

export default function CartPage() {
  const { cartLines, changeQty, totals } = useStore();
  const canCheckout = cartLines.length > 0;

  return (
    <main className="main">
      <Hero eyebrow="Cart" title="Review your cart." lead="Update quantities or proceed to checkout." />
      <section className="two-col">
        <div className="panel">
          <h2>Cart items</h2>
          {cartLines.length ? cartLines.map((line) => (
            <div className="cart-line" key={line.id}>
              <div className="mini">{line.category.slice(0, 2).toUpperCase()}</div>
              <div><strong>{line.name}</strong><p className="desc">{money(line.price)} - {line.status}</p></div>
              <div className="qty"><button onClick={() => changeQty(line.id, -1)}>-</button><span>{line.qty}</span><button onClick={() => changeQty(line.id, 1)}>+</button></div>
              <strong>{money(line.price * line.qty)}</strong>
            </div>
          )) : <div className="empty">Cart is empty.</div>}
        </div>
        <aside className="panel">
          <h2>Order summary</h2>
          <SummaryBox totals={totals} />
          <div className="form-grid" style={{ marginTop: 16 }}>
            {canCheckout ? (
              <Link className="primary-btn" to="/checkout">Checkout</Link>
            ) : (
              <>
                <button className="primary-btn" type="button" disabled>Checkout</button>
                <p style={{ marginTop: 8, color: "#c7cdd4", fontSize: 14 }}>Add items to your cart before checking out.</p>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
