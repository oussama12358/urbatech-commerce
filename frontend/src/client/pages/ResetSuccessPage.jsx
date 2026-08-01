import { Link } from "react-router-dom";
import { t, useLocale } from "../../i18n.js";

export default function ResetSuccessPage() {
  useLocale();
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store">
            <span className="brand-mark">UTI</span>
            <span className="brand-text">URBA TECH <span>INTER</span></span>
          </Link>
          <div>
            <h1>{t("passwordUpdatedTitle")}</h1>
            <p>{t("passwordUpdatedLead")}</p>
          </div>
        </div>

        <div className="success-message" style={{ color: "#4CAF50", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ marginBottom: "8px" }}>{t("passwordChanged")}</h2>
          <p>{t("passwordChangedSuccess")}</p>
        </div>

        <Link className="primary-btn" to="/login" style={{ textAlign: "center", display: "block" }}>
          {t("goToLogin")}
        </Link>
      </section>
    </main>
  );
}
