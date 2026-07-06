import { useRef, useState } from "react";
import { Eye, Plug, RefreshCw, Trash2 } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";

const defaultCapabilities = {
  supports_products: true,
  supports_stock: true,
  supports_prices: true,
  supports_orders: true,
  supports_tracking: true
};

export default function Suppliers() {
  const { suppliers, addSupplier, deleteSupplier, testSupplier, syncSupplier } = useStore();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [formPhase, setFormPhase] = useState("idle");
  const [pendingSupplier, setPendingSupplier] = useState(null);
  const [detailsSupplier, setDetailsSupplier] = useState(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState(null);
  const [deleteImportedProducts, setDeleteImportedProducts] = useState(false);
  const [authMode, setAuthMode] = useState("bearer");
  const [customHeaders, setCustomHeaders] = useState([]);
  const formRef = useRef(null);

  const getFriendlyError = (error) => {
    const message = String(error?.message || error || "").trim();
    const normalized = message.toLowerCase();

    if (!message) {
      return "Unable to connect to supplier. Please verify the API URL and credentials.";
    }
    if (normalized.includes("failed to parse url") || normalized.includes("invalid url") || normalized.includes("invalid api url")) {
      return "❌ Invalid API URL. Example: https://supplier.com/api";
    }
    if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("timeout") || normalized.includes("refused") || normalized.includes("connect")) {
      return "Unable to connect to supplier. Please verify the API URL and credentials.";
    }
    return message;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setPendingSupplier(null);
    setFormPhase("saving");

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const apiUrl = String(form.api_url || "").trim();
    if (!apiUrl) {
      setError("API URL is required.");
      setFormPhase("idle");
      return;
    }

    try {
      new URL(apiUrl);
    } catch {
      setError("❌ Invalid API URL. Example: https://supplier.com/api");
      setFormPhase("idle");
      return;
    }

    const payload = {
      company_name: form.company_name,
      adapter: form.adapter,
      api_url: apiUrl,
      auth_mode: form.auth_mode,
      api_key: form.api_key,
      api_secret: form.api_secret,
      api_key_header: form.api_key_header || "X-API-Key",
      webhook_secret: form.webhook_secret,
      custom_headers: authMode === "custom-headers"
        ? customHeaders.reduce((headers, entry) => {
            if (entry.name?.trim()) headers[entry.name.trim()] = entry.value || "";
            return headers;
          }, {})
        : {},
      supports_products: Boolean(form.supports_products),
      supports_stock: Boolean(form.supports_stock),
      supports_prices: Boolean(form.supports_prices),
      supports_orders: Boolean(form.supports_orders),
      supports_tracking: Boolean(form.supports_tracking)
    };

    try {
      const supplier = await addSupplier(payload);
      setFormPhase("testing");
      try {
        await testSupplier(supplier.id);
        setFormPhase("success");
        event.currentTarget.reset();
        setTimeout(() => setFormPhase("idle"), 3000);
      } catch (testError) {
        setPendingSupplier(supplier);
        setFormPhase("failed");
        setError(getFriendlyError(testError));
      }
    } catch (err) {
      setError(getFriendlyError(err) || "Unable to add supplier");
      setFormPhase("idle");
    }
  };

  const promptDeleteSupplier = (supplier) => {
    setDeleteSupplierTarget(supplier);
    setDeleteImportedProducts(false);
  };

  const closeDeleteSupplier = () => {
    setDeleteSupplierTarget(null);
    setDeleteImportedProducts(false);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteSupplierTarget) return;
    const action = deleteImportedProducts ? "delete" : "deactivate";
    await runAction(deleteSupplierTarget.id, (id) => deleteSupplier(id, action));
    closeDeleteSupplier();
  };

  const openSupplierDetails = (supplier) => {
    setDetailsSupplier(supplier);
  };

  const closeSupplierDetails = () => {
    setDetailsSupplier(null);
  };

  const runAction = async (id, action) => {
    setError("");
    setFormPhase("idle");
    try {
      setBusyId(id);
      await action(id);
    } catch (err) {
      setError(err.message || "Supplier action failed");
    } finally {
      setBusyId("");
    }
  };

  const retainPendingSupplier = () => {
    setPendingSupplier(null);
    setError("");
    setFormPhase("idle");
  };

  const discardPendingSupplier = async () => {
    if (!pendingSupplier) return;
    await deleteSupplier(pendingSupplier.id);
    setPendingSupplier(null);
    setError("");
    setFormPhase("idle");
  };

  const statusVariant = (status) => {
    if (status === "Connected") return "connected";
    if (status === "Syncing") return "syncing";
    return "disconnected";
  };

  const renderStatus = (status) => {
    const value = status || "Disconnected";
    return (
      <span className={`status-pill ${statusVariant(value)}`}>
        {value}
      </span>
    );
  };

  const renderHealth = (health) => {
    let label = "Unknown";
    let variant = "unknown";
    const value = (health || "").toString().toLowerCase();

    if (value.includes("healthy") || value.includes("ok") || value.includes("good")) {
      label = "Healthy";
      variant = "healthy";
    } else if (value.includes("warn") || value.includes("degraded")) {
      label = "Warning";
      variant = "warning";
    } else if (value.includes("offline") || value.includes("down") || value.includes("failed")) {
      label = "Offline";
      variant = "offline";
    }

    return (
      <span className={`health-pill ${variant}`}>
        {label}
      </span>
    );
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return "Never synced";
    const date = new Date(timestamp);
    const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">Supply chain</p>
          <h2>Suppliers Integration</h2>
          <p className="page-copy">Connect suppliers and synchronize products, inventory and orders.</p>
        </div>
      </div>

      <section className="panel form-grid supplier-panel" style={{ marginBottom: 18 }}>
        <div className="admin-section-head">
          <div>
            <h2>New Supplier</h2>
            <span>Configure a supplier REST API.</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form ref={formRef} className="form-grid supplier-form" onSubmit={submit}>
          <div className="form-grid three">
            <label className="field-group">
              <span>Company name</span>
              <input className="input" name="company_name" placeholder="Supplier company name" required />
            </label>
            <label className="field-group">
              <span>Integration type</span>
              <select className="select" name="adapter" defaultValue="universal">
                <option value="universal">Universal REST API</option>
              </select>
            </label>
            <label className="field-group">
              <span>API URL</span>
              <input className="input" name="api_url" placeholder="https://supplier.com/api" required />
            </label>
          </div>

          <div className="form-grid three">
            <label className="field-group">
              <span>Authentication</span>
              <select
                className="select"
                name="auth_mode"
                value={authMode}
                onChange={(event) => {
                  const nextAuth = event.target.value;
                  setAuthMode(nextAuth);
                  if (nextAuth === "custom-headers" && customHeaders.length === 0) {
                    setCustomHeaders([{ name: "", value: "" }]);
                  }
                }}
              >
                <option value="bearer">Bearer Token</option>
                <option value="api-key">API Key (Header)</option>
                <option value="basic">API Key + Secret</option>
                <option value="custom-headers">Custom Headers</option>
                <option value="none">No Authentication</option>
              </select>
            </label>

            {authMode === "bearer" && (
              <label className="field-group">
                <span>Bearer Token</span>
                <input className="input" name="api_key" placeholder="Bearer token" />
              </label>
            )}

            {authMode === "api-key" && (
              <>
                <label className="field-group">
                  <span>Header name</span>
                  <input className="input" name="api_key_header" defaultValue="X-API-Key" />
                </label>
                <label className="field-group">
                  <span>API Key</span>
                  <input className="input" name="api_key" placeholder="API key" />
                </label>
              </>
            )}

            {authMode === "basic" && (
              <>
                <label className="field-group">
                  <span>API Key</span>
                  <input className="input" name="api_key" placeholder="API key" />
                </label>
                <label className="field-group">
                  <span>Secret Key</span>
                  <input className="input" name="api_secret" placeholder="Secret Key" />
                </label>
              </>
            )}

            {authMode === "custom-headers" && (
              <div className="custom-headers full-width">
                <div className="custom-headers-title">
                  <span>Custom headers</span>
                  <p className="field-note">Add any request headers required by the supplier API.</p>
                </div>
                <div className="custom-headers-headings">
                  <span>Header name</span>
                  <span>Header value</span>
                  <span />
                </div>
                {customHeaders.map((header, index) => (
                  <div key={index} className="custom-header-row">
                    <label className="field-group">
                      <input
                        className="input"
                        value={header.name}
                        onChange={(event) => {
                          const next = [...customHeaders];
                          next[index] = { ...next[index], name: event.target.value };
                          setCustomHeaders(next);
                        }}
                        placeholder="X-API-Key"
                      />
                    </label>
                    <label className="field-group">
                      <input
                        className="input"
                        value={header.value}
                        onChange={(event) => {
                          const next = [...customHeaders];
                          next[index] = { ...next[index], value: event.target.value };
                          setCustomHeaders(next);
                        }}
                        placeholder="abc123 or Bearer token"
                      />
                    </label>
                    <button
                      className="secondary-btn compact-btn remove-header-btn"
                      type="button"
                      onClick={() => setCustomHeaders(customHeaders.filter((_, idx) => idx !== index))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="secondary-btn add-header-btn"
                  type="button"
                  onClick={() => setCustomHeaders([...customHeaders, { name: "", value: "" }])}
                >
                  Add header
                </button>
              </div>
            )}

            {authMode === "none" && (
              <div className="field-note full-width">No credentials required. This supplier will connect without authentication.</div>
            )}
          </div>

          <label className="field-group full-width">
            <span>Webhook Secret (Optional)</span>
            <input className="input" name="webhook_secret" placeholder="Optional" />
            <small className="field-hint">Only required if your supplier supports signed webhooks.</small>
          </label>

          <div className="capability-grid">
            {Object.entries(defaultCapabilities).map(([name]) => (
              <label key={name} className="capability-card">
                <input type="checkbox" name={name} defaultChecked />
                <div>
                  <strong>{name.replace("supports_", "").replace("_", " ")}</strong>
                  <span>Sync catalog</span>
                </div>
              </label>
            ))}
          </div>

          {formPhase === "saving" && <div className="form-status-banner">Saving supplier...</div>}
          {formPhase === "testing" && <div className="form-status-banner">Testing API connection...</div>}
          {formPhase === "success" && <div className="form-status-success">✅ Supplier saved successfully.</div>}
          {formPhase === "failed" && error && (
            <div className="form-status-error">
              <strong>❌ Unable to connect to supplier.</strong>
              <p>{error}</p>
              <div className="pending-actions">
                <button className="secondary-btn" type="button" onClick={discardPendingSupplier}>Discard</button>
                <button className="primary-btn" type="button" onClick={retainPendingSupplier}>Save anyway</button>
              </div>
            </div>
          )}

          <div className="button-row">
            <button className="primary-btn supplier-save-btn" type="submit" disabled={formPhase === "saving" || formPhase === "testing"}>
              {formPhase === "saving" ? "Saving..." : formPhase === "testing" ? "Testing..." : "Save supplier"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="admin-section-head">
          <h2>Connected suppliers</h2>
          <span>{suppliers.filter((supplier) => !pendingSupplier || supplier.id !== pendingSupplier.id).length} suppliers</span>
        </div>
        {suppliers.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Status</th>
                <th>API health</th>
                <th>Last sync</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers
                .filter((supplier) => !pendingSupplier || supplier.id !== pendingSupplier.id)
                .map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.company_name}</td>
                    <td>{renderStatus(supplier.status)}</td>
                    <td>{renderHealth(supplier.api_health)}</td>
                    <td>{formatLastSync(supplier.last_sync_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          type="button"
                          title="Connect / Test API"
                          disabled={busyId === supplier.id}
                          onClick={() => runAction(supplier.id, testSupplier)}
                        >
                          <Plug />
                        </button>
                        <button
                          className="icon-btn"
                          type="button"
                          title="Sync products"
                          disabled={busyId === supplier.id}
                          onClick={() => runAction(supplier.id, syncSupplier)}
                        >
                          <RefreshCw />
                        </button>
                        <button
                          className="icon-btn"
                          type="button"
                          title="Supplier details"
                          disabled={busyId === supplier.id}
                          onClick={() => openSupplierDetails(supplier)}
                        >
                          <Eye />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          type="button"
                          title="Delete supplier"
                          disabled={busyId === supplier.id}
                          onClick={() => promptDeleteSupplier(supplier)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div>
              <div className="empty-state-icon">📦</div>
              <h3>No suppliers connected yet.</h3>
              <p>Connect your first supplier to start synchronizing products and orders.</p>
            </div>
          </div>
        )}
      </section>

      {detailsSupplier && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeSupplierDetails}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-details-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="supplier-details-title">{detailsSupplier.company_name}</h2>
            <div className="supplier-details-grid">
              <div>
                <strong>API URL</strong>
                <p>{detailsSupplier.api_url}</p>
              </div>
              <div>
                <strong>Authentication</strong>
                <p>{detailsSupplier.auth_mode}</p>
              </div>
              <div>
                <strong>Status</strong>
                <p>{detailsSupplier.status || "Disconnected"}</p>
              </div>
              <div>
                <strong>API health</strong>
                <p>{detailsSupplier.api_health || "Unknown"}</p>
              </div>
              <div>
                <strong>Last sync</strong>
                <p>{formatLastSync(detailsSupplier.last_sync_at)}</p>
              </div>
              <div>
                <strong>Webhook</strong>
                <p>{detailsSupplier.webhook_secret ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <div className="confirm-actions">
              <button className="secondary-btn" type="button" onClick={closeSupplierDetails}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
      {deleteSupplierTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDeleteSupplier}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="supplier-delete-title">Delete supplier</h2>
            <p>This will remove the supplier integration. Imported products will remain in your database unless you choose to delete them.</p>
            <label className="field-group">
              <span>
                <input
                  type="checkbox"
                  checked={deleteImportedProducts}
                  onChange={(event) => setDeleteImportedProducts(event.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Delete imported products
              </span>
              <small>
                This only removes current product records from the catalogue. Past orders, invoices, payments and sales history remain unchanged.
              </small>
            </label>
            <div className="confirm-actions">
              <button className="secondary-btn" type="button" onClick={closeDeleteSupplier}>
                Cancel
              </button>
              <button className="danger-btn" type="button" onClick={confirmDeleteSupplier}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
