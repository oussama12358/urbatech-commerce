import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import SummaryBox from "../components/SummaryBox.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { showToast } from "../../shared/lib/toast.js";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, cartLines, totals, clearCart, createOrder, createCheckoutSession, paymentProviders } = useStore();

  const [paymentMethod, setPaymentMethod] = useState("");
  const redirectedRef = useRef(false);
  const enabledPaymentProviders = paymentProviders.filter((provider) => provider.enabled);

  useEffect(() => {
    if (!cartLines.length && !redirectedRef.current) {
      redirectedRef.current = true;
      showToast("Your cart is empty. Continue shopping.", "error");
      navigate("/store", { replace: true });
    }
  }, [cartLines.length, navigate]);

  useEffect(() => {
    if (!enabledPaymentProviders.length) {
      setPaymentMethod("");
      return;
    }
    const hasSelected = enabledPaymentProviders.some((provider) => provider.provider_key === paymentMethod);
    if (!hasSelected) {
      setPaymentMethod(enabledPaymentProviders[0].provider_key);
    }
  }, [enabledPaymentProviders, paymentMethod]);

  const submit = async (event) => {
    event.preventDefault();
    if (!cartLines.length) {
      showToast("Your cart is empty. Continue shopping.", "error");
      navigate("/store");
      return;
    }
    const formValues = Object.fromEntries(new FormData(event.currentTarget));
    const billing = {
      ...formValues,
      customerName: `${formValues.firstName || ""} ${formValues.lastName || ""}`.trim() || user?.name,
      customerEmail: user?.email || formValues.email
    };

    try {
      const order = await createOrder(billing, { clearCartAfterCreate: false });
      const response = await createCheckoutSession(order.id, paymentMethod);
      if (response.url) {
        clearCart();
        window.location.assign(response.url);
      } else if (response.redirectUrl) {
        clearCart();
        window.location.assign(response.redirectUrl);
      }
    } catch (err) {
      console.error(err);
        const fallback = "Selected payment method is unavailable. Please try another or contact support.";
        showToast(err.message && typeof err.message === "string" ? err.message : fallback, "error");
        // keep user on checkout so they can pick another method or retry
        navigate("/checkout", { replace: true });
    }
  };

  return (
    <main className="main">
      <Hero eyebrow="Checkout" title="Complete your purchase." lead="Enter your billing and delivery information to finalize the order." />
      <section className="two-col">
        <form className="panel form-grid" onSubmit={submit}>
          <h2>Billing information</h2>
          <div className="form-grid two">
            <label>
              First name *
              <input className="input" name="firstName" placeholder="First name" defaultValue={user?.name?.split(" ")[0] || ""} required />
            </label>
            <label>
              Last name *
              <input className="input" name="lastName" placeholder="Last name" required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Email *
              <input className="input" name="email" type="email" defaultValue={user?.email || ""} placeholder="email@example.com" required />
            </label>
            <label>
              Phone *
              <input className="input" name="phone" placeholder="+216 XX XXX XXX" required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Country *
              <input className="input" name="country" placeholder="Country" required />
            </label>
            <label>
              City *
              <input className="input" name="city" placeholder="City" required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Postal code *
              <input className="input" name="postalCode" placeholder="Postal code" required />
            </label>
            <label>
              Address *
              <input className="input" name="address" placeholder="Street address, building, suite..." required />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Apartment (optional)
              <input className="input" name="apartment" placeholder="Apt, suite, floor..." />
            </label>
            <div />
          </div>
          <label>
            Order notes (optional)
            <textarea className="input" name="notes" rows={4} placeholder="Delivery instructions, gate code, preferred delivery time..." />
          </label>

          <div className="payment-panel">
            <div>
              <label htmlFor="paymentMethod">Payment method</label>
              {enabledPaymentProviders.length ? (
                <>
                  <select
                    id="paymentMethod"
                    className="select"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    required
                  >
                    {enabledPaymentProviders.map((provider) => (
                      <option key={provider.provider_key} value={provider.provider_key}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <p className="payment-hint">You will be redirected to the selected secure payment page.</p>
                  <div className="payment-logos">
                    {enabledPaymentProviders.map((provider) => (
                      <span key={provider.provider_key} className="payment-badge">
                        {provider.name}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="payment-warning">
                  <p>⚠ No payment methods are currently available.</p>
                  <p>Please contact support or try again later.</p>
                </div>
              )}
            </div>
            <div className="checkout-actions">
              <div className="checkout-paystack">
                <button
                  className="primary-btn full-width"
                  type="submit"
                  disabled={!enabledPaymentProviders.length}
                >
                  Pay {enabledPaymentProviders.length ? money(totals.total) : ""}
                </button>
                <span className="pay-lock-badge">🔒 Total secured</span>
              </div>
              <Link className="secondary-btn full-width" to="/cart">
                ← Back to cart
              </Link>
            </div>
          </div>
        </form>

        <aside className="panel summary-panel">
          <div className="summary-header">
            <div>
              <h2>Order summary</h2>
              <p>{cartLines.length} item{cartLines.length === 1 ? "" : "s"}</p>
            </div>
            <div className="summary-trust">
              <span>🔒 Secure payment</span>
            </div>
          </div>
          <div className="summary-items">
            {cartLines.map((item) => (
              <div key={item.id} className="summary-item">
                <span>{item.name}</span>
                <span>{item.qty} × {money(item.price)}</span>
                <strong>{money(item.qty * item.price)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-meta">
            <span>Estimated delivery</span>
            <strong>3-5 business days</strong>
          </div>
          <SummaryBox totals={totals} />
          {enabledPaymentProviders.length ? (
            <div className="summary-supported">
              <span className="summary-supported-label">Accepted payment methods</span>
              <div className="payment-logos summary-payment-logos">
                {enabledPaymentProviders.map((provider) => (
                  <span key={provider.provider_key} className="payment-badge">
                    {provider.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="summary-note">All totals include service fees and estimated shipping. Final payment is processed securely.</p>
          <p className="summary-help">Questions? Check the support details in the footer below.</p>
        </aside>
      </section>
    </main>
  );
}
