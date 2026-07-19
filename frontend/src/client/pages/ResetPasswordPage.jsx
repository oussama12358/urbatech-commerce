import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createApiClient } from "../../shared/lib/api.js";
import { t, useLocale } from "../../i18n.js";

export default function ResetPasswordPage() {
  useLocale();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("ready");

  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("verificationTokenMissing"));
    }
  }, [token]);

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password)
  };

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return false;
    }
    if (Object.values(passwordRules).includes(false)) {
      setError(t("passwordRequirements"));
      return false;
    }
    return true;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      const api = createApiClient();
      const json = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password })
      });
      setStatus("success");
      setMessage(json.message || t("passwordResetSuccess"));
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/reset-success", { replace: true }), 2000);
    } catch (err) {
      setStatus("error");
      setError(err.message || t("unableResetPassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store">
            <span className="brand-mark">U</span>
            <span className="brand-text">URBA TECH <span>INTER</span></span>
          </Link>
          <div>
            <h1>{t("resetPasswordTitle")}</h1>
            <p>{t("resetPasswordLead")}</p>
          </div>
        </div>

        {status === "error" && message && (
          <div className="error-message" style={{ color: "#ffb3b3", marginBottom: "16px" }}>
            <h3>✗ {message}</h3>
          </div>
        )}

        {status === "success" ? (
          <div className="success-message" style={{ color: "#4CAF50", marginBottom: "20px" }}>
            <h3>✓ {message}</h3>
            <p>{t("redirectToLoginSoon")}</p>
          </div>
        ) : (
          <form className="form-grid" onSubmit={submit}>
            <input
              className="input"
              name="password"
              type="password"
              placeholder={t("newPasswordPlaceholder")}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
                if (message) setMessage("");
              }}
              required
            />
            <input
              className="input"
              name="confirmPassword"
              type="password"
              placeholder={t("confirmNewPasswordPlaceholder")}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              required
            />
            <div className="password-status">{t("passwordStrength")}: <strong>{Object.values(passwordRules).filter(Boolean).length}/5</strong></div>
            <ul className="password-hint compact" aria-label={t("passwordRequirements")}>
              <li className={passwordRules.length ? "valid" : ""}>{t("passwordHintLength")}</li>
              <li className={passwordRules.upper ? "valid" : ""}>{t("passwordHintUpper")}</li>
              <li className={passwordRules.lower ? "valid" : ""}>{t("passwordHintLower")}</li>
              <li className={passwordRules.digit ? "valid" : ""}>{t("passwordHintDigit")}</li>
              <li className={passwordRules.symbol ? "valid" : ""}>{t("passwordHintSymbol")}</li>
            </ul>
            {error && <div className="error-message" style={{ color: "#ffb3b3" }}>{error}</div>}
            <button className="primary-btn" type="submit" disabled={loading || !token}>{loading ? t("resetting") : t("resetPasswordButton")}</button>
            <Link className="secondary-btn" to="/login">{t("backToLogin")}</Link>
          </form>
        )}
      </section>
    </main>
  );
}
