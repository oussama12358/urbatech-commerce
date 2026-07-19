import { useState } from "react";
import { Link } from "react-router-dom";
import { createApiClient } from "../../shared/lib/api.js";
import { t, useLocale } from "../../i18n.js";

export default function ForgotPasswordPage() {
  useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const api = createApiClient();
      const json = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setMessage(json.message || t("resetEmailFallback"));
      setEmail("");
    } catch (err) {
      setError(err.message || t("resetLinkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store"><span className="brand-mark">U</span><span className="brand-text">URBA TECH <span>INTER</span></span></Link>
          <div>
            <h1>{t("forgotPasswordTitle")}</h1>
            <p>{t("forgotPasswordLead")}</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <input
            className="input"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading}>{loading ? t("sending") : t("sendResetLink")}</button>
          <Link className="secondary-btn" to="/login">{t("backToLogin")}</Link>
        </form>
      </section>
    </main>
  );
}
