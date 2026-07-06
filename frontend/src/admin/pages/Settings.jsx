import { useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";

function StatusBadge({ active, label }) {
  return (
    <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>
      {active ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {active ? label : "Not " + label}
    </span>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const payments = settings.payments || {};

  const changeStorefront = async (storefrontEnabled) => {
    setSaving(true);
    setError("");
    try {
      await updateSettings({ storefrontEnabled });
    } catch (err) {
      setError(err.message || "Unable to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Configuration</p>
          <h2>Settings</h2>
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: 14 }}>{error}</div>}

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2>Storefront</h2>
        <div className="kv">
          <div className="kv-row">
            <span>Status</span>
            <div className="segmented-control" role="radiogroup" aria-label="Storefront status">
              <button
                className={settings.storefrontEnabled ? "active" : ""}
                type="button"
                disabled={saving}
                onClick={() => changeStorefront(true)}
              >
                Enabled
              </button>
              <button
                className={!settings.storefrontEnabled ? "active" : ""}
                type="button"
                disabled={saving}
                onClick={() => changeStorefront(false)}
              >
                Disabled
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Payments</h2>
        <div className="kv">
          <div className="kv-row">
            <span>Stripe</span>
            <div className="badge-row">
              <StatusBadge active={payments.stripe?.configured} label="Configured" />
              <StatusBadge active={payments.stripe?.enabled} label="Enabled" />
            </div>
          </div>
          <div className="kv-row">
            <span>PayPal</span>
            <div className="badge-row">
              <StatusBadge active={payments.paypal?.configured} label="Configured" />
              <StatusBadge active={payments.paypal?.enabled} label="Enabled" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}