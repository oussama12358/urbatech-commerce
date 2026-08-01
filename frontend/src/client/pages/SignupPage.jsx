import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { showToast } from "../../shared/lib/toast.js";
import EyeIcon from "../assets/eye.svg";
import EyeOffIcon from "../assets/eye-off.svg";
import { useLocale, t } from "../../i18n.js";

export default function SignupPage() {
  const { login } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  useLocale();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password)
  };

  const passwordHints = [
    { key: "length", label: t("passwordHintLength") },
    { key: "upper", label: t("passwordHintUpper") },
    { key: "lower", label: t("passwordHintLower") },
    { key: "digit", label: t("passwordHintDigit") },
    { key: "symbol", label: t("passwordHintSymbol") }
  ];

  const passed = Object.values(passwordRules).filter(Boolean).length;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const form = Object.fromEntries(new FormData(event.currentTarget));

    if (form.password !== form.confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }

    if (Object.values(passwordRules).includes(false)) {
      setError(t("passwordRequirements"));
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password
    };

    setLoading(true);
    try {
      const api = createApiClient();
      const json = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (json?.user && json?.token) {
        await login({ ...json.user, token: json.token });
        navigate(location.state?.next || "/store", { replace: true });
        return;
      }

      setSignupSuccess(true);
      setSignupEmail(payload.email);
      setVerificationEmailSent(!json?.emailDeliveryFailed);
    } catch (err) {
      setError(err.message || t("signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    if (error) setError("");
    if (event.target.name === "password") {
      setPassword(event.target.value);
    }
    if (event.target.name === "confirmPassword") {
      setConfirmPassword(event.target.value);
    }
  };

  const resendVerificationEmail = async () => {
    setResendLoading(true);
    try {
      const api = createApiClient();
      const json = await api("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: signupEmail })
      });
      showToast(json?.message || t("verificationEmailResent"), "success");
    } catch (err) {
      showToast(err.message || t("verificationEmailResendError"), "error");
    } finally {
      setResendLoading(false);
    }
  };

  // Show success message
  if (signupSuccess) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <Link className="brand" to="/store">
              <span className="brand-mark">UTI</span>
              <span className="brand-text">URBA TECH <span>INTER</span></span>
            </Link>
            <h1>{t("verifyYourEmail")}</h1>
          </div>
          <div className="success-message" style={{ color: "#2e7d32", marginBottom: "20px", padding: "20px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #4CAF50" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#1b5e20" }}>✓ {t("accountCreated")}</h3>
            <p style={{ margin: "8px 0", fontSize: "15px", color: "#1b5e20", fontWeight: "500" }}>
              {t("verifyEmailText")} <strong style={{ fontSize: "16px", color: "#000" }}>{signupEmail}</strong>
            </p>
            <p style={{ margin: "12px 0 0 0", fontSize: "14px", lineHeight: "1.5", color: "#1b5e20" }}>
              {verificationEmailSent
                ? t("checkYourInbox")
                : t("resendEmailText")}
            </p>
          </div>
          <div style={{ marginTop: "20px", padding: "18px", backgroundColor: "#fff3e0", borderRadius: "8px", border: "1px solid #ffb74d" }}>
            <p style={{ fontSize: "15px", marginBottom: "12px", fontWeight: "600", color: "#e65100" }}>
              💡 {t("didntReceiveEmail")}
            </p>
            <ul style={{ fontSize: "14px", marginLeft: "20px", lineHeight: "1.7", color: "#555" }}>
              <li>{t("checkSpamFolder")}</li>
              <li>{t("confirmEmailAddress")}</li>
              <li>{t("verificationLinkExpires")}</li>
            </ul>
            <button
              type="button"
              className="primary-btn"
              onClick={resendVerificationEmail}
              disabled={resendLoading}
              style={{ width: "100%", marginTop: "16px" }}
            >
              {resendLoading ? t("loggingIn") : t("resendEmail")}
            </button>
          </div>
          <Link className="secondary-btn" to="/login" state={{ next: location.state?.next }} style={{ marginTop: "20px" }}>
            {t("backToLogin")}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store"><span className="brand-mark">UTI</span><span className="brand-text">URBA TECH <span>INTER</span></span></Link>
          <div>
            <h1>{t("createAccount")}</h1>
            <p>{t("signUpText")}</p>
          </div>
        </div>
        {error && <div className="error-message" style={{ color: "#ffb3b3", marginBottom: "12px", fontSize: "14px" }}>{error}</div>}
        <form className="form-grid" onSubmit={submit}>
          <input className="input" name="name" placeholder={t("fullNamePlaceholder")} autoComplete="name" onChange={handleInputChange} required />
          <input className="input" name="email" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" onChange={handleInputChange} required />
          <div className="password-wrapper">
            <input className="input" name="password" type={showPassword ? "text" : "password"} placeholder={t("createPasswordPlaceholder")} autoComplete="new-password" minLength={8} onChange={handleInputChange} required />
            {password && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img src={showPassword ? EyeIcon : EyeOffIcon} alt="" />
              </button>
            )}
          </div>
          <div className="password-status">{t("passwordStrength")}: <strong>{passed}/5</strong> <span className={passed === 5 ? "valid-tick" : ""}>✓</span></div>
          <ul className="password-hint compact" aria-label="Password requirements">
            {passwordHints.map((hint) => (
              <li key={hint.key} className={passwordRules[hint.key] ? "valid" : ""}>{hint.label}</li>
            ))}
          </ul>
          <div className="password-wrapper">
            <input className="input" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={t("confirmPasswordPlaceholder")} autoComplete="new-password" minLength={8} onChange={handleInputChange} required />
            {confirmPassword && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <img src={showConfirmPassword ? EyeIcon : EyeOffIcon} alt="" />
              </button>
            )}
          </div>
          <button className="primary-btn" type="submit" disabled={loading}>{loading ? t("loggingIn") : t("createAccount")}</button>
          <Link className="secondary-btn" to="/login" state={{ next: location.state?.next }}>{t("backToLogin")}</Link>
        </form>
      </section>
    </main>
  );
}
