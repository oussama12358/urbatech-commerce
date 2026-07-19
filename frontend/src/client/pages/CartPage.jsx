import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import SummaryBox from "../components/SummaryBox.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function CartPage() {
  useLocale();
  const { cartLines, changeQty, totals } = useStore();
  const canCheckout = cartLines.length > 0;

  return (
    <main className="main">
      <Hero eyebrow={t("cart")} title={t("cartPageTitle")} lead={t("cartPageLead")} />
      <section className="two-col">
        <div className="panel">
          <h2>{t("cartItems")}</h2>
          {cartLines.length ? cartLines.map((line) => (
            <div className="cart-line" key={line.id}>
              <div className="mini">{line.category.slice(0, 2).toUpperCase()}</div>
              <div><strong>{line.name}</strong><p className="desc">{money(line.price)} - {line.status}</p></div>
              <div className="qty"><button onClick={() => changeQty(line.id, -1)}>-</button><span>{line.qty}</span><button onClick={() => changeQty(line.id, 1)}>+</button></div>
              <strong>{money(line.price * line.qty)}</strong>
            </div>
          )) : <div className="empty">{t("cartEmpty")}</div>}
        </div>
        <aside className="panel">
          <h2>{t("orderSummary")}</h2>
          <SummaryBox totals={totals} />
          <div className="form-grid" style={{ marginTop: 16 }}>
            {canCheckout ? (
              <Link className="primary-btn" to="/checkout">{t("checkout")}</Link>
            ) : (
              <>
                <button className="primary-btn" type="button" disabled>{t("checkout")}</button>
                <p style={{ marginTop: 8, color: "#c7cdd4", fontSize: 14 }}>{t("addItemsToCartBeforeCheckout")}</p>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
