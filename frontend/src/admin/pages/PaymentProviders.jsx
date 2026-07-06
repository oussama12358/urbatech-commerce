import { useEffect, useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";

export default function PaymentProviders() {
  const { user, paymentProviders, refreshPaymentProviders, updatePaymentProvider } = useStore();
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [editingProviderKey, setEditingProviderKey] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [editingConfig, setEditingConfig] = useState("{}");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    refreshPaymentProviders().catch((err) => setError(err.message || "Unable to load payment providers."));
  }, [user?.token]);

  useEffect(() => {
    if (!editingProviderId) return;
    const provider = paymentProviders.find((item) => item.id === editingProviderId);
    if (!provider) return;
    setEditingProviderKey(provider.provider_key);
    setEditingName(provider.name);
    setEditingDescription(provider.description || "");
    setEditingEnabled(provider.enabled);
    setEditingConfig(JSON.stringify(provider.config || {}, null, 2));
  }, [editingProviderId, paymentProviders]);

  const toggleEnabled = async (provider) => {
    setError("");
    setSavingId(provider.id);
    try {
      await updatePaymentProvider(provider.id, { enabled: !provider.enabled });
      await refreshPaymentProviders();
    } catch (err) {
      setError(err.message || "Unable to update provider.");
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (provider) => {
    setError("");
    setEditingProviderId(provider.id);
  };

  const cancelEdit = () => {
    setEditingProviderId(null);
    setEditingName("");
    setEditingDescription("");
    setEditingConfig("{}");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editingProviderId) return;
    setError("");
    setSavingEdit(true);

    let configPayload = {};
    try {
      configPayload = JSON.parse(editingConfig);
    } catch (err) {
      setError("Config must be valid JSON.");
      setSavingEdit(false);
      return;
    }

    try {
      await updatePaymentProvider(editingProviderId, {
        name: editingName,
        description: editingDescription,
        enabled: editingEnabled,
        config: configPayload
      });
      await refreshPaymentProviders();
      cancelEdit();
    } catch (err) {
      setError(err.message || "Unable to save provider.");
    } finally {
      setSavingEdit(false);
    }
  };

  const activeProvider = paymentProviders.find((provider) => provider.id === editingProviderId);

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Payments</p>
          <h2>Payment Providers</h2>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <section className="panel">
        <p>
          Enable only real online payment gateways. Stripe redirects customers to hosted card and wallet checkout. PayPal redirects customers to PayPal checkout. Offline methods are not shown as Pay buttons.
        </p>
      </section>
      <section className="panel">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentProviders.map((provider) => (
                <tr key={provider.id}>
                  <td>{provider.name}</td>
                  <td>{provider.provider_key}</td>
                  <td>{provider.description}</td>
                  <td>{provider.enabled ? "Enabled" : "Disabled"}</td>
                  <td>
                    <button
                      className="secondary-btn"
                      type="button"
                      disabled={savingId === provider.id}
                      onClick={() => toggleEnabled(provider)}
                    >
                      {provider.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="secondary-btn"
                      type="button"
                      style={{ marginLeft: "0.5rem" }}
                      onClick={() => startEdit(provider)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {activeProvider && (
        <section className="panel">
          <h3>Edit {activeProvider.name}</h3>
          <form className="form-grid" onSubmit={saveEdit}>
            <div className="form-grid two">
              <label>
                Provider Key
                <input className="input" value={editingProviderKey} readOnly />
              </label>
              <label>
                Display Name
                <input
                  className="input"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-grid two">
              <label>
                Enabled
                <select
                  className="select"
                  value={editingEnabled ? "true" : "false"}
                  onChange={(event) => setEditingEnabled(event.target.value === "true")}
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </label>
            </div>
            <label>
              Description
              <textarea
                className="input"
                rows={3}
                value={editingDescription}
                onChange={(event) => setEditingDescription(event.target.value)}
              />
            </label>
            <label>
              Config (JSON)
              <textarea
                className="input"
                rows={8}
                value={editingConfig}
                onChange={(event) => setEditingConfig(event.target.value)}
              />
            </label>
            <div className="form-grid two">
              <button className="primary-btn" type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save provider"}
              </button>
              <button className="secondary-btn" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
