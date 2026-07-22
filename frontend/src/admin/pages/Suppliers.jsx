import { useEffect, useRef, useState } from "react";
import { Eye, Plug, RefreshCw, Trash2, Upload } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

const defaultCapabilities = {
  supports_products: true,
  supports_stock: true,
  supports_prices: true,
  supports_orders: true,
  supports_tracking: true
};

export default function Suppliers() {
  useLocale();
  const { suppliers, addSupplier, deleteSupplier, testSupplier, syncSupplier, importSupplierProducts, listSupplierProductImports, updateSupplier } = useStore();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [formPhase, setFormPhase] = useState("idle");
  const [pendingSupplier, setPendingSupplier] = useState(null);
  const [detailsSupplier, setDetailsSupplier] = useState(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState(null);
  const [deleteImportedProducts, setDeleteImportedProducts] = useState(false);
  const [authMode, setAuthMode] = useState("bearer");
  const [customHeaders, setCustomHeaders] = useState([]);
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState("");
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
    if (normalized.includes("failed to parse url") || normalized.includes("invalid url") || normalized.includes("invalid api url")) {
      return t("invalidApiUrlExample");
    }
    if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("timeout") || normalized.includes("refused") || normalized.includes("connect")) {
      return t("unableToConnectSupplier");
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
      adapter: form.adapter,
      api_url: apiUrl,
      notification_email: form.notification_email,
      contact_email: form.notification_email,
      auth_mode: form.auth_mode,
      api_key: form.api_key,
      api_secret: form.api_secret,
      api_key_header: form.api_key_header || t("apiKeyHeaderDefault"),
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
      if (apiUrl) {
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
      } else {
        setFormPhase("success");
        event.currentTarget.reset();
        setTimeout(() => setFormPhase("idle"), 3000);
      }
    } catch (err) {
      setError(getFriendlyError(err) || t("unableToAddSupplier"));
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
      const result = await action(id);
      return result;
    } catch (err) {
      setError(err.message || t("supplierActionFailed"));
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
    const value = status || t("disconnected");
    return (
      <span className={`status-pill ${statusVariant(value)}`}>
        {value}
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
      setImportError(t("selectSupplierAndFile"));
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
      setImportError(err.message || t("unableToPreviewImport"));
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
      setImportError(err.message || t("unableToImportProducts"));
    } finally {
      setImportBusy(false);
    }
  };

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
            <h2>{t("newSupplier")}</h2>
            <span>{t("configureSupplierLead")}</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form ref={formRef} className="form-grid supplier-form" onSubmit={submit}>
          <div className="form-grid three">
            <label className="field-group">
              <span>{t("companyName")}</span>
              <input className="input" name="company_name" placeholder={t("supplierCompanyPlaceholder")} required />
            </label>
            <label className="field-group">
              <span>{t("integrationType")}</span>
              <select className="select" name="adapter" defaultValue="universal">
                <option value="universal">{t("universalRestApi")}</option>
              </select>
            </label>
            <label className="field-group">
              <span>{t("apiUrl")}</span>
              <input className="input" name="api_url" placeholder={t("apiUrlPlaceholder")} />
            </label>
          </div>

          <label className="field-group full-width">
            <span>{t("supplierNotificationEmail")}</span>
            <input className="input" name="notification_email" type="email" placeholder="supplier@example.com" />
            <small className="field-hint">{t("supplierNotificationEmailHint")}</small>
          </label>

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
                  <input className="input" name="api_key_header" defaultValue={t("apiKeyHeaderDefault")} />
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
            <h2>{t("importSupplierProducts")}</h2>
            <span>{t("importSupplierProductsLead")}</span>
          </div>
        </div>
        {importError && <div className="error-message">{importError}</div>}
        <div className="form-grid three">
          <label className="field-group">
            <span>{t("supplier")}</span>
            <select
              className="select"
              value={importSupplierId}
              onChange={(event) => {
                setImportSupplierId(event.target.value);
                setImportPreview(null);
                setImportError("");
              }}
            >
              <option value="">{t("selectSupplier")}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
              ))}
            </select>
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
          <div className="button-row" style={{ alignItems: "end" }}>
            <button className="secondary-btn" type="button" disabled={importBusy} onClick={previewImport}>
              <Upload />
              {importBusy ? t("processing") : t("previewImport")}
            </button>
          </div>
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

      <section className="panel">
        <div className="admin-section-head">
          <h2>{t("connectedSuppliersTitle")}</h2>
          <span>{suppliers.filter((supplier) => !pendingSupplier || supplier.id !== pendingSupplier.id).length} {t("suppliers")}</span>
        </div>
        {suppliers.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>{t("supplier")}</th>
                <th>{t("status")}</th>
                <th>{t("apiHealth")}</th>
                <th>{t("lastSync")}</th>
                <th>{t("actions")}</th>
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
              <div className="empty-state-icon">📦</div>
              <h3>{t("noSuppliersConnectedYet")}</h3>
              <p>{t("connectYourFirstSupplierLead")}</p>
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
                <strong>{t("apiUrl")}</strong>
                <p>{detailsSupplier.api_url}</p>
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
                <p>{detailsSupplier.status || t("disconnected")}</p>
              </div>
              <div>
                <strong>{t("apiHealth")}</strong>
                <p>{detailsSupplier.api_health || t("unknown")}</p>
              </div>
              <div>
                <strong>{t("lastSync")}</strong>
                <p>{formatLastSync(detailsSupplier.last_sync_at)}</p>
              </div>
              
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
                          // optimistic UI update so clicks feel responsive
                          setDetailsSupplier((prev) => ({ ...prev, [key]: checked }));
                          // debug log to help trace UI events
                          // eslint-disable-next-line no-console
                          console.log('[Suppliers] checkbox change', { supplierId, key, checked });
                          try {
                            const updated = await runAction(supplierId, (id) => updateSupplier(id, { [key]: checked }));
                            // eslint-disable-next-line no-console
                            console.log('[Suppliers] updateSupplier result', updated);
                            if (updated) setDetailsSupplier(updated);
                            // If enabling a capability and supplier has api_url, trigger sync
                            if (checked && (updated?.api_url || supplierApiUrl)) {
                              // fire-and-forget sync, but show busy state
                              runAction(supplierId, syncSupplier).catch(() => {});
                            }
                          } catch (err) {
                            // revert optimistic update on failure
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
            </div>
            <div className="confirm-actions">
              <button className="secondary-btn" type="button" onClick={closeSupplierDetails}>
                {t("close")}
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
            <h2 id="supplier-delete-title">{t("deleteSupplier")}</h2>
            <p>{t("deleteSupplierWarning")}</p>
            <label className="field-group">
              <span>
                <input
                  type="checkbox"
                  checked={deleteImportedProducts}
                  onChange={(event) => setDeleteImportedProducts(event.target.checked)}
                  style={{ marginRight: 8 }}
                />
                {t("deleteImportedProducts")}
              </span>
              <small>
                {t("deleteImportedProductsHint")}
              </small>
            </label>
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
