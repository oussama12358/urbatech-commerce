import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, List, Plug, Power, RefreshCw, Trash2, Upload } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";
import COUNTRIES from "../../shared/lib/countries.js";
import { normalizeCountryCodes } from "../../shared/lib/shipping.js";

const defaultCapabilities = {
  supports_products: true,
  supports_stock: true,
  supports_prices: true,
  supports_orders: true,
  supports_tracking: true
};

export default function Suppliers() {
  useLocale();
  const { user, suppliers, addSupplier, deleteSupplier, testSupplier, syncSupplier, importSupplierProducts, listSupplierProductImports, updateSupplier } = useStore();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [formPhase, setFormPhase] = useState("idle");
  const [pendingSupplier, setPendingSupplier] = useState(null);
  const [detailsSupplier, setDetailsSupplier] = useState(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState(null);
  const [authMode, setAuthMode] = useState("bearer");
  const [customHeaders, setCustomHeaders] = useState([]);
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");
  const [apiShipsTo, setApiShipsTo] = useState("");
  const [manualShipsTo, setManualShipsTo] = useState("");
  const [detailsShipsTo, setDetailsShipsTo] = useState("");
  const [detailsShipsBusy, setDetailsShipsBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (!importSupplierId) {
      setImportHistory([]);
      return undefined;
    }
    let mounted = true;
    listSupplierProductImports(importSupplierId)
      .then((rows) => {
        if (mounted) setImportHistory(rows);
      })
      .catch(() => {
        if (mounted) setImportHistory([]);
      });
    return () => {
      mounted = false;
    };
  }, [importSupplierId]);

  const readFileBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 18 * 1024 * 1024) {
        reject(new Error(t("productFileTooLarge")));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const getFriendlyError = (error) => {
    const message = String(error?.message || error || "").trim();
    const normalized = message.toLowerCase();
    if (!message) {
      return t("unableToConnectSupplier");
    }

    // If backend provided a structured error key + params, use it for localization
    if (error && error.errorKey) {
      let translated = t(error.errorKey);
      const params = error.errorParams || {};
      Object.keys(params).forEach((k) => {
        translated = translated.replace(`{${k}}`, String(params[k]));
      });
      return translated;
    }

    // Map backend supplier API errors with status to localized message (fallback)
    if (error && error.status) {
      return t("supplierApiFailedWithStatus").replace("{code}", String(error.status));
    }
    // Fallback: raw message containing supplier API failed with code
    if (normalized.includes("supplier api failed")) {
      const m = message.match(/Supplier API failed with\s*(\d+)/i);
      const code = m ? m[1] : "unknown";
      return t("supplierApiFailedWithStatus").replace("{code}", String(code));
    }
    if (normalized.includes("failed to parse url") || normalized.includes("invalid url") || normalized.includes("invalid api url")) {
      return t("invalidApiUrlExample");
    }
    if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("timeout") || normalized.includes("refused") || normalized.includes("connect")) {
      return t("unableToConnectSupplier");
    }
    return message;
  };

  const submitSupplier = async (event, mode) => {
    event.preventDefault();
    setError("");
    setPendingSupplier(null);
    setFormPhase("saving");

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const isManualIntegration = mode === "manual";
    const apiUrl = isManualIntegration ? "" : String(form.api_url || "").trim();
    if (apiUrl) {
      try {
        new URL(apiUrl);
      } catch {
        setError(t("invalidApiUrlExample"));
        setFormPhase("idle");
        return;
      }
    }

    const payload = {
      company_name: form.company_name,
      adapter: isManualIntegration ? "generic" : "universal",
      api_url: apiUrl,
      notification_email: form.notification_email,
      contact_email: form.notification_email,
      auth_mode: isManualIntegration ? "none" : form.auth_mode,
      api_key: isManualIntegration ? "" : form.api_key,
      api_secret: isManualIntegration ? "" : form.api_secret,
      api_key_header: isManualIntegration ? t("apiKeyHeaderDefault") : form.api_key_header || t("apiKeyHeaderDefault"),
      webhook_secret: isManualIntegration ? "" : form.webhook_secret,
      custom_headers: !isManualIntegration && authMode === "custom-headers"
        ? customHeaders.reduce((headers, entry) => {
            if (entry.name?.trim()) headers[entry.name.trim()] = entry.value || "";
            return headers;
          }, {})
        : {},
      supports_products: isManualIntegration ? true : Boolean(form.supports_products),
      supports_stock: isManualIntegration ? false : Boolean(form.supports_stock),
      supports_prices: isManualIntegration ? false : Boolean(form.supports_prices),
      supports_orders: isManualIntegration ? true : Boolean(form.supports_orders),
      supports_tracking: isManualIntegration ? false : Boolean(form.supports_tracking),
      ships_to_countries: normalizeCountryCodes(isManualIntegration ? manualShipsTo : apiShipsTo),
      ...(isManualIntegration ? { status: form.status || "Active" } : {})
    };

    try {
      const supplier = await addSupplier(payload);
      if (apiUrl) {
        setFormPhase("testing");
        try {
          await testSupplier(supplier.id);
          setFormPhase("success");
          event.currentTarget.reset();
          setApiShipsTo("");
          setTimeout(() => setFormPhase("idle"), 3000);
        } catch (testError) {
          setPendingSupplier(supplier);
          setFormPhase("failed");
          setError(getFriendlyError(testError));
        }
      } else {
        setFormPhase("success");
        event.currentTarget.reset();
        setManualShipsTo("");
        setTimeout(() => setFormPhase("idle"), 3000);
      }
    } catch (err) {
      setError(getFriendlyError(err) || t("unableToAddSupplier"));
      setFormPhase("idle");
    }
  };

  const submitApiSupplier = (event) => submitSupplier(event, "api");

  const submitManualSupplier = (event) => submitSupplier(event, "manual");

  const promptDeleteSupplier = (supplier) => {
    setDeleteSupplierTarget(supplier);
  };

  const closeDeleteSupplier = () => {
    setDeleteSupplierTarget(null);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteSupplierTarget) return;
    await runAction(deleteSupplierTarget.id, (id) => deleteSupplier(id, "delete"));
    closeDeleteSupplier();
  };

  const openSupplierImport = (supplier) => {
    setImportSupplierId(supplier.id);
    setImportFile(null);
    setImportPreview(null);
    setImportError("");
  };

  const closeSupplierImport = () => {
    setImportSupplierId("");
    setImportFile(null);
    setImportPreview(null);
    setImportError("");
    setImportHistory([]);
  };

  const openSupplierDetails = (supplier) => {
    setDetailsSupplier(supplier);
    setDetailsShipsTo((supplier.ships_to_countries || []).join(", "));
  };

  const closeSupplierDetails = () => {
    setDetailsSupplier(null);
    setDetailsShipsTo("");
    setDetailsShipsBusy(false);
  };

  const saveDetailsShipsTo = async () => {
    if (!detailsSupplier) return;
    setDetailsShipsBusy(true);
    setError("");
    try {
      const shipsTo = normalizeCountryCodes(detailsShipsTo);
      const updated = await runAction(detailsSupplier.id, (id) =>
        updateSupplier(id, { ships_to_countries: shipsTo })
      );
      if (updated) {
        setDetailsSupplier(updated);
        setDetailsShipsTo((updated.ships_to_countries || []).join(", "));
      }
    } catch (err) {
      setError(getFriendlyError(err) || t("supplierActionFailed"));
    } finally {
      setDetailsShipsBusy(false);
    }
  };

  const formatShipsToDisplay = (codes) => {
    const list = Array.isArray(codes) ? codes : [];
    if (!list.length) return t("shipsWorldwide");
    return list
      .map((code) => {
        const country = COUNTRIES.find((item) => item.code === code);
        return country ? `${country.name} (${code})` : code;
      })
      .join(", ");
  };

  const runAction = async (id, action) => {
    setError("");
    setFormPhase("idle");
    try {
      setBusyId(id);
      const result = await action(id);
      return result;
    } catch (err) {
      setError(getFriendlyError(err) || t("supplierActionFailed"));
      throw err;
    } finally {
      setBusyId("");
    }
  };

  const retainPendingSupplier = () => {
    setPendingSupplier(null);
    setError("");
    setFormPhase("idle");
  };

  const setManualSupplierStatus = async (supplier, status) => {
    const updated = await runAction(supplier.id, (id) => updateSupplier(id, { status }));
    if (detailsSupplier?.id === supplier.id && updated) setDetailsSupplier(updated);
    return updated;
  };

  const discardPendingSupplier = async () => {
    if (!pendingSupplier) return;
    await deleteSupplier(pendingSupplier.id);
    setPendingSupplier(null);
    setError("");
    setFormPhase("idle");
  };

  const statusVariant = (status) => {
    if (status === "Connected" || status === "Active") return "connected";
    if (status === "Syncing") return "syncing";
    return "disconnected";
  };

  const getStatusLabel = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "connected" || s === "active") return t("active");
    if (s === "syncing") return t("syncing");
    if (s === "inactive") return t("inactive");
    if (s === "disconnected") return t("disconnected");
    return status || t("disconnected");
  };

  const renderStatus = (status) => {
    const label = getStatusLabel(status);
    return (
      <span className={`status-pill ${statusVariant(status)}`}>
        {label}
      </span>
    );
  };

  const renderHealth = (health) => {
    let label = t("unknown");
    let variant = "unknown";
    const value = (health || "").toString().toLowerCase();

    if (value.includes("healthy") || value.includes("ok") || value.includes("good")) {
      label = t("healthy");
      variant = "healthy";
    } else if (value.includes("manual")) {
      label = t("manual");
      variant = "unknown";
    } else if (value.includes("warn") || value.includes("degraded")) {
      label = t("warning");
      variant = "warning";
    } else if (value.includes("offline") || value.includes("down") || value.includes("failed")) {
      label = t("offline");
      variant = "offline";
    }

    return (
      <span className={`health-pill ${variant}`}>
        {label}
      </span>
    );
  };

  const renderIntegration = (supplier) => {
    if (!supplier.api_url || supplier.adapter === "generic") return t("sourceImport");
    return t("sourceApi");
  };

  const isManualSupplierRecord = (supplier) => !supplier.api_url || supplier.adapter === "generic";

  const formatLastSync = (timestamp) => {
    if (!timestamp) return t("neverSynced");
    const date = new Date(timestamp);
    const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return t("secondsAgo").replace("{count}", diffSeconds);
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return t("minutesAgo").replace("{count}", diffMinutes);
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return t("hoursAgo").replace("{count}", diffHours);
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo").replace("{count}", diffDays);
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return "-";
    if (milliseconds < 1000) return `${milliseconds}ms`;
    return `${(milliseconds / 1000).toFixed(1)}s`;
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const previewImport = async () => {
    if (!importSupplierId || !importFile) {
      setImportError(t("selectProductFile"));
      return;
    }
    setImportBusy(true);
    setImportError("");
    setImportPreview(null);
    try {
      const contentBase64 = await readFileBase64(importFile);
      const preview = await importSupplierProducts(importSupplierId, {
        fileName: importFile.name,
        contentBase64,
        dryRun: true
      });
      setImportPreview(preview);
    } catch (err) {
      setImportError(getFriendlyError(err) || t("unableToPreviewImport"));
    } finally {
      setImportBusy(false);
    }
  };

  const commitImport = async () => {
    if (!importSupplierId || !importFile) return;
    setImportBusy(true);
    setImportError("");
    try {
      const contentBase64 = await readFileBase64(importFile);
      const result = await importSupplierProducts(importSupplierId, {
        fileName: importFile.name,
        contentBase64,
        dryRun: false
      });
      setImportPreview(result);
      setImportFile(null);
      const history = await listSupplierProductImports(importSupplierId).catch(() => []);
      setImportHistory(history);
    } catch (err) {
      setImportError(getFriendlyError(err) || t("unableToImportProducts"));
    } finally {
      setImportBusy(false);
    }
  };

  const importTargetSupplier = suppliers.find((supplier) => supplier.id === importSupplierId) || null;
  const visibleSuppliers = suppliers.filter((supplier) => !pendingSupplier || supplier.id !== pendingSupplier.id);
  const apiSuppliers = visibleSuppliers.filter((supplier) => !isManualSupplierRecord(supplier));
  const manualSuppliers = visibleSuppliers.filter(isManualSupplierRecord);

  return (
    <main className="admin-main">
      <div className="admin-page-head">
        <div>
          <p className="eyebrow">{t("supplyChain")}</p>
          <h2>{t("suppliersIntegration")}</h2>
          <p className="page-copy">{t("suppliersIntegrationLead")}</p>
        </div>
      </div>

      <section className="panel form-grid supplier-panel" style={{ marginBottom: 18 }}>
        <div className="admin-section-head">
          <div>
            <h2>{t("newApiSupplier")}</h2>
            <span>{t("configureApiSupplierLead")}</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form ref={formRef} className="form-grid supplier-form" onSubmit={submitApiSupplier}>
          <div className="form-grid three">
            <label className="field-group">
              <span>{t("companyName")}</span>
              <input className="input" name="company_name" placeholder={t("supplierCompanyPlaceholder")} required />
            </label>
            <label className="field-group">
              <span>{t("apiUrl")}</span>
              <input className="input" name="api_url" placeholder={t("apiUrlPlaceholder")} required />
            </label>
            <label className="field-group">
              <span>{t("supplierNotificationEmail")}</span>
              <input className="input" name="notification_email" type="email" placeholder="supplier@example.com" />
            </label>
          </div>

          <div className="form-grid three">
            <label className="field-group">
              <span>{t("authentication")}</span>
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
                <option value="bearer">{t("bearerToken")}</option>
                <option value="api-key">{t("apiKeyHeader")}</option>
                <option value="basic">{t("apiKeySecret")}</option>
                <option value="custom-headers">{t("customHeaders")}</option>
                <option value="none">{t("noAuthentication")}</option>
              </select>
            </label>

            {authMode === "bearer" && (
              <label className="field-group">
                <span>{t("bearerToken")}</span>
                <input className="input" name="api_key" placeholder={t("bearerTokenPlaceholder")} />
              </label>
            )}

            {authMode === "api-key" && (
              <>
                <label className="field-group">
                  <span>{t("headerName")}</span>
                  <input className="input" name="api_key_header" placeholder={t("apiKeyHeaderDefault")} />
                </label>
                <label className="field-group">
                  <span>{t("apiKey")}</span>
                  <input className="input" name="api_key" placeholder={t("apiKeyPlaceholder")} />
                </label>
              </>
            )}

            {authMode === "basic" && (
              <>
                <label className="field-group">
                  <span>{t("apiKey")}</span>
                  <input className="input" name="api_key" placeholder={t("apiKeyPlaceholder")} />
                </label>
                <label className="field-group">
                  <span>{t("secretKey")}</span>
                  <input className="input" name="api_secret" placeholder={t("secretKeyPlaceholder")} />
                </label>
              </>
            )}

            {authMode === "custom-headers" && (
              <div className="custom-headers full-width">
                <div className="custom-headers-title">
                  <span>{t("customHeaders")}</span>
                  <p className="field-note">{t("customHeadersNote")}</p>
                </div>
                <div className="custom-headers-headings">
                  <span>{t("headerName")}</span>
                  <span>{t("headerValue")}</span>
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
                        placeholder={t("apiKeyHeaderDefault")}
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
                        placeholder={t("apiKeyHeaderValuePlaceholder")}
                      />
                    </label>
                    <button
                      className="secondary-btn compact-btn remove-header-btn"
                      type="button"
                      onClick={() => setCustomHeaders(customHeaders.filter((_, idx) => idx !== index))}
                    >
                      {t("remove")}
                    </button>
                  </div>
                ))}
                <button
                  className="secondary-btn add-header-btn"
                  type="button"
                  onClick={() => setCustomHeaders([...customHeaders, { name: "", value: "" }])}
                >
                  {t("addHeader")}
                </button>
              </div>
            )}

            {authMode === "none" && (
              <div className="field-note full-width">{t("noCredentialsRequired")}</div>
            )}
          </div>

          <label className="field-group full-width">
            <span>{t("webhookSecretOptional")}</span>
            <input className="input" name="webhook_secret" placeholder={t("optional")} />
            <small className="field-hint">{t("webhookSecretHint")}</small>
          </label>

          <label className="field-group full-width">
            <span>{t("shipsToCountries")}</span>
            <input
              className="input"
              value={apiShipsTo}
              onChange={(event) => setApiShipsTo(event.target.value)}
              placeholder={t("shipsToCountriesPlaceholder")}
            />
            <small className="field-hint">{t("shipsToCountriesHint")}</small>
          </label>

          <div className="capability-grid">
            {Object.entries(defaultCapabilities).map(([name]) => (
              <label key={name} className="capability-card">
                <input type="checkbox" name={name} defaultChecked />
                <div>
                  <strong>{name.replace("supports_", "").replace("_", " ")}</strong>
                  <span>{t("syncCatalog")}</span>
                </div>
              </label>
            ))}
          </div>

          {formPhase === "saving" && <div className="form-status-banner">{t("savingSupplier")}</div>}
          {formPhase === "testing" && <div className="form-status-banner">{t("testingApiConnection")}</div>}
          {formPhase === "success" && <div className="form-status-success">✅ {t("supplierSavedSuccessfully")}</div>}
          {formPhase === "failed" && error && (
            <div className="form-status-error">
              <strong>❌ {t("unableToConnectToSupplier")}</strong>
              <p>{error}</p>
              <div className="pending-actions">
                <button className="secondary-btn" type="button" onClick={discardPendingSupplier}>{t("discard")}</button>
                <button className="primary-btn" type="button" onClick={retainPendingSupplier}>{t("saveAnyway")}</button>
              </div>
            </div>
          )}

          <div className="button-row">
            <button className="primary-btn supplier-save-btn" type="submit" disabled={formPhase === "saving" || formPhase === "testing"}>
              {formPhase === "saving" ? t("savingSupplier") : formPhase === "testing" ? t("testingApiConnection") : t("saveSupplier")}
            </button>
          </div>
        </form>
      </section>

      <section className="panel form-grid supplier-panel" style={{ marginBottom: 18 }}>
        <div className="admin-section-head">
          <div>
            <h2>{t("newExcelSupplier")}</h2>
            <span>{t("configureExcelSupplierLead")}</span>
          </div>
        </div>
        <form className="form-grid supplier-form" onSubmit={submitManualSupplier}>
          <div className="form-grid three">
            <label className="field-group">
              <span>{t("companyName")}</span>
              <input className="input" name="company_name" placeholder={t("supplierCompanyPlaceholder")} required />
            </label>
            <label className="field-group">
              <span>{t("supplierNotificationEmail")}</span>
              <input className="input" name="notification_email" type="email" placeholder="supplier@example.com" />
            </label>
            <label className="field-group">
              <span>{t("status")}</span>
              <select className="select" name="status" defaultValue="Active">
                <option value="Active">{t("active")}</option>
                <option value="Inactive">{t("inactive")}</option>
              </select>
            </label>
          </div>
          <label className="field-group full-width">
            <span>{t("shipsToCountries")}</span>
            <input
              className="input"
              value={manualShipsTo}
              onChange={(event) => setManualShipsTo(event.target.value)}
              placeholder={t("shipsToCountriesPlaceholder")}
            />
            <small className="field-hint">{t("shipsToCountriesHint")}</small>
          </label>
          <div className="field-note full-width">{t("manualSupplierImportHint")}</div>
          <div className="button-row">
            <button className="primary-btn supplier-save-btn" type="submit" disabled={formPhase === "saving" || formPhase === "testing"}>
              {formPhase === "saving" ? t("savingSupplier") : t("saveSupplier")}
            </button>
          </div>
        </form>
      </section>

      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="admin-section-head">
          <h2>{t("apiSuppliersTitle")}</h2>
          <span>{apiSuppliers.length} {t("suppliers")}</span>
        </div>
        {apiSuppliers.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("supplier")}</th>
                <th>{t("status")}</th>
                <th>{t("products")}</th>
                <th>{t("apiHealth")}</th>
                <th>{t("lastSync")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {apiSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.company_name}</td>
                    <td>{renderStatus(supplier.status)}</td>
                    <td>{supplier.products_count || 0}</td>
                    <td>{renderHealth(supplier.api_health)}</td>
                    <td>{formatLastSync(supplier.last_sync_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          type="button"
                          title={t("connectTestApi")}
                          disabled={busyId === supplier.id || !supplier.api_url}
                          onClick={() => runAction(supplier.id, testSupplier)}
                        >
                          <Plug />
                        </button>
                        <button
                          className="icon-btn"
                          type="button"
                          title={t("syncProducts")}
                          disabled={busyId === supplier.id || !supplier.api_url}
                          onClick={() => runAction(supplier.id, syncSupplier)}
                        >
                          <RefreshCw />
                        </button>
                        <button
                          className="icon-btn"
                          type="button"
                          title={t("supplierDetails")}
                          disabled={busyId === supplier.id}
                          onClick={() => openSupplierDetails(supplier)}
                        >
                          <Eye />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          type="button"
                          title={t("deleteSupplier")}
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
              {(!user || !user.token || user.role?.toLowerCase() !== "admin") ? (
                <>
                  <h3>{t("noApiSuppliersYet")}</h3>
                  <p>Sign in as an administrator to view suppliers.</p>
                </>
              ) : (
                <>
                  <h3>{t("noApiSuppliersYet")}</h3>
                  <p>{t("connectYourFirstSupplierLead")}</p>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="admin-section-head">
          <h2>{t("excelSuppliersTitle")}</h2>
          <span>{manualSuppliers.length} {t("suppliers")}</span>
        </div>
        {manualSuppliers.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("supplier")}</th>
                <th>{t("status")}</th>
                <th>{t("products")}</th>
                <th>{t("lastSync")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {manualSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.company_name}</td>
                  <td>{renderStatus(supplier.status)}</td>
                  <td>{supplier.products_count || 0}</td>
                  <td>{formatLastSync(supplier.last_sync_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        type="button"
                        title={t("importSupplierProducts")}
                        disabled={busyId === supplier.id || supplier.status === "Inactive"}
                        onClick={() => openSupplierImport(supplier)}
                      >
                        <Upload />
                      </button>
                      <Link
                        className="icon-btn"
                        title={t("viewProducts")}
                        to={`/admin/products?source=import&supplier_id=${encodeURIComponent(supplier.id)}`}
                      >
                        <List />
                      </Link>
                      <button
                        className="icon-btn"
                        type="button"
                        title={supplier.status === "Inactive" ? t("activateSupplier") : t("deactivateSupplier")}
                        disabled={busyId === supplier.id}
                        onClick={() => setManualSupplierStatus(supplier, supplier.status === "Inactive" ? "Active" : "Inactive")}
                      >
                        <Power />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        title={t("supplierDetails")}
                        disabled={busyId === supplier.id}
                        onClick={() => openSupplierDetails(supplier)}
                      >
                        <Eye />
                      </button>
                      <button
                        className="icon-btn danger-icon"
                        type="button"
                        title={t("deleteSupplier")}
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
              <h3>{t("noExcelSuppliersYet")}</h3>
              <p>{t("manualSupplierImportHint")}</p>
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
                <strong>{t("integrationType")}</strong>
                <p>{renderIntegration(detailsSupplier)}</p>
              </div>
              <div>
                <strong>{t("products")}</strong>
                <p>{detailsSupplier.products_count || 0}</p>
              </div>
              <div>
                <strong>{t("apiUrl")}</strong>
                <p>{detailsSupplier.api_url || "-"}</p>
              </div>
              <div>
                <strong>{t("supplierNotificationEmail")}</strong>
                <p>{detailsSupplier.notification_email || detailsSupplier.contact_email || "-"}</p>
              </div>
              <div>
                <strong>{t("authentication")}</strong>
                <p>{detailsSupplier.auth_mode}</p>
              </div>
              <div>
                <strong>{t("status")}</strong>
                <p>{getStatusLabel(detailsSupplier.status)}</p>
              </div>
              <div>
                <strong>{t("apiHealth")}</strong>
                <p>{detailsSupplier.api_health || t("unknown")}</p>
              </div>
              <div>
                <strong>{t("lastSync")}</strong>
                <p>{formatLastSync(detailsSupplier.last_sync_at)}</p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <strong>{t("shipsToCountries")}</strong>
                <p style={{ marginBottom: 8 }}>{formatShipsToDisplay(detailsSupplier.ships_to_countries)}</p>
                <div className="form-grid" style={{ gap: 8 }}>
                  <input
                    className="input"
                    value={detailsShipsTo}
                    onChange={(event) => setDetailsShipsTo(event.target.value)}
                    placeholder={t("shipsToCountriesPlaceholder")}
                  />
                  <small className="field-hint">{t("shipsToCountriesHint")}</small>
                  <button
                    className="secondary-btn"
                    type="button"
                    disabled={detailsShipsBusy}
                    onClick={saveDetailsShipsTo}
                  >
                    {detailsShipsBusy ? t("savingSupplier") : t("saveShipsToCountries")}
                  </button>
                </div>
              </div>

              {!isManualSupplierRecord(detailsSupplier) && (
                <>
                  <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                    <strong>{t('suppliersIntegration')}</strong>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      {[
                        ['supports_products', t('products')],
                        ['supports_stock', t('stock')],
                        ['supports_prices', t('price')],
                        ['supports_orders', t('orders')],
                        ['supports_tracking', t('tracking')]
                      ].map(([key, label]) => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(detailsSupplier[key])}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              const supplierId = detailsSupplier.id;
                              const supplierApiUrl = detailsSupplier.api_url;
                              setDetailsSupplier((prev) => ({ ...prev, [key]: checked }));
                              try {
                                const updated = await runAction(supplierId, (id) => updateSupplier(id, { [key]: checked }));
                                if (updated) setDetailsSupplier(updated);
                                if (checked && (updated?.api_url || supplierApiUrl)) {
                                  runAction(supplierId, syncSupplier).catch(() => {});
                                }
                              } catch (err) {
                                setDetailsSupplier((prev) => ({ ...prev, [key]: !checked }));
                              }
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>{t("webhook")}</strong>
                    <p>{detailsSupplier.webhook_secret ? t("enabled") : t("disabled")}</p>
                  </div>
                </>
              )}
            </div>
            <div className="confirm-actions">
              {isManualSupplierRecord(detailsSupplier) && (
                <button
                  className="secondary-btn"
                  type="button"
                  disabled={busyId === detailsSupplier.id}
                  onClick={() => setManualSupplierStatus(detailsSupplier, detailsSupplier.status === "Inactive" ? "Active" : "Inactive")}
                >
                  <Power />
                  {detailsSupplier.status === "Inactive" ? t("activateSupplier") : t("deactivateSupplier")}
                </button>
              )}
              <button className="secondary-btn" type="button" onClick={closeSupplierDetails}>
                {t("close")}
              </button>
            </div>
          </section>
        </div>
      )}
      {importTargetSupplier && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeSupplierImport}>
          <section
            className="confirm-dialog wide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-import-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-section-head">
              <div>
                <h2 id="supplier-import-title">{t("importSupplierProducts")}</h2>
                <span>{importTargetSupplier.company_name}</span>
              </div>
            </div>
            <p className="page-copy">{t("importSupplierProductsLead")}</p>
            <p className="notice" role="note">{t("excelImportIdentityHint")}</p>
            {importError && <div className="error-message">{importError}</div>}
            <div className="form-grid two">
              <label className="field-group">
                <span>{t("supplier")}</span>
                <input className="input muted-input" value={importTargetSupplier.company_name} disabled readOnly />
              </label>
              <label className="field-group">
                <span>{t("productFile")}</span>
                <input
                  className="input"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] || null);
                    setImportPreview(null);
                    setImportError("");
                  }}
                />
              </label>
            </div>
            <div className="button-row">
              <button className="secondary-btn" type="button" onClick={closeSupplierImport}>
                {t("cancel")}
              </button>
              <button className="primary-btn" type="button" disabled={importBusy} onClick={previewImport}>
                <Upload />
                {importBusy ? t("processing") : t("previewImport")}
              </button>
            </div>
            {importPreview && (
              <div className="import-preview">
                <div className="stat-grid">
                  <div className="stat-card"><strong>{importPreview.total_rows}</strong><span>{t("rowsFound")}</span></div>
                  <div className="stat-card"><strong>{importPreview.valid_count}</strong><span>{t("validProducts")}</span></div>
                  <div className="stat-card"><strong>{importPreview.error_count}</strong><span>{t("importErrors")}</span></div>
                </div>
                {importPreview.sample?.length > 0 && (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t("product")}</th>
                          <th>{t("supplierSku")}</th>
                          <th>{t("category")}</th>
                          <th>{t("price")}</th>
                          <th>{t("cost")}</th>
                          <th>{t("stock")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.sample.map((product, index) => (
                          <tr key={`${product.supplier_product_id || product.name}-${index}`}>
                            <td>{product.name}</td>
                            <td>{product.supplier_product_id || "-"}</td>
                            <td>{product.category || "-"}</td>
                            <td>{product.price}</td>
                            <td>{product.cost_price}</td>
                            <td>{product.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {importPreview.errors?.length > 0 && (
                  <div className="error-message">
                    {importPreview.errors.slice(0, 5).map((item) => (
                      <div key={item.row}>{t("row")} {item.row}: {item.errors.join(" ")}</div>
                    ))}
                  </div>
                )}
                {!importPreview.dry_run && (
                  <div className="form-status-success">
                    {t("importCompleted")}: {importPreview.imported_count || 0} {t("imported")}, {importPreview.created_count || 0} {t("created")}, {importPreview.updated_count || 0} {t("updated")}, {importPreview.skipped_count || 0} {t("skipped")}
                    {importPreview.duplicate_candidates_count ? `, ${importPreview.duplicate_candidates_count} ${t("duplicateCandidates")}` : ""}
                  </div>
                )}
                {importPreview.dry_run && (
                  <button className="primary-btn" type="button" disabled={importBusy || !importPreview.valid_count} onClick={commitImport}>
                    {importBusy ? t("processing") : t("importProducts")}
                  </button>
                )}
              </div>
            )}
            {importHistory.length > 0 && (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("file")}</th>
                      <th>{t("rowsFound")}</th>
                      <th>{t("validProducts")}</th>
                      <th>{t("importErrors")}</th>
                      <th>{t("imported")}</th>
                      <th>{t("created")}</th>
                      <th>{t("updated")}</th>
                      <th>{t("skipped")}</th>
                      <th>{t("duplicates")}</th>
                      <th>{t("duration")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((batch) => (
                      <tr key={batch.id}>
                        <td>{batch.file_name}</td>
                        <td>{batch.total_rows}</td>
                        <td>{batch.valid_count}</td>
                        <td>{batch.error_count}</td>
                        <td>{batch.imported_count || 0}</td>
                        <td>{batch.created_count || 0}</td>
                        <td>{batch.updated_count || 0}</td>
                        <td>{batch.skipped_count || 0}</td>
                        <td>{batch.duplicate_candidates_count || 0}</td>
                        <td>{formatDuration(batch.duration_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            <h2 id="supplier-delete-title">{t("deleteSupplier")}</h2>
            <strong>{deleteSupplierTarget.company_name}</strong>
            <p>{t("deleteSupplierWarning")}</p>
            <div className="confirm-actions">
              <button className="secondary-btn" type="button" onClick={closeDeleteSupplier}>
                {t("cancel")}
              </button>
              <button className="danger-btn" type="button" onClick={confirmDeleteSupplier}>
                {t("delete")}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
