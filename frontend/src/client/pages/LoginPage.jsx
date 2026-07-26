import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import GoogleLogo from "../assets/google.svg";
import AppleLogo from "../assets/apple.svg";
import EyeIcon from "../assets/eye.svg";
import EyeOffIcon from "../assets/eye-off.svg";
import { useLocale, t } from "../../i18n.js";

const isAdmin = (user) => user?.role?.toLowerCase() === "admin";
const isAdminPath = (path) => path?.startsWith("/admin");
const resolveAfterLogin = (user, next) => {
  if (isAdmin(user)) {
    return isAdminPath(next) ? next : "/admin/dashboard";
  }
  return isAdminPath(next) ? "/store" : next || "/store";
};

export default function LoginPage() {
  const { login, settings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  useLocale();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      const name = params.get("name") || "Google user";
      const email = params.get("email") || "";
      const role = params.get("role") || "Client";
      const next = params.get("next") || location.state?.next;
      const finishGoogleLogin = async () => {
        const remember = params.get("remember") === "1";
        const googleUser = { id: "google", name, email, role, token };
        await login(googleUser, { remember });
        navigate(resolveAfterLogin(googleUser, next), { replace: true });
      };
      finishGoogleLogin();
    }
  }, [location.search, location.state, login, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const loginPayload = {
      email: email,
      password: password,
      remember: rememberMe
    };

    setLoading(true);
    try {
      const api = createApiClient();
      const json = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginPayload)
      });

      await login({ ...json.user, token: json.token }, { remember: rememberMe });
      navigate(resolveAfterLogin(json.user, location.state?.next), { replace: true });
    } catch (err) {
      // Handle email verification required or disabled account errors
      if (err.message?.includes("Email not verified")) {
        if (!settings?.disableEmailVerification) {
          setError(t("emailNotVerified"));
        } else {
          setError(err.message || t("loginFailed"));
        }
      } else if (err.message?.includes("Account disabled")) {
        setError(t("accountDisabled"));
      } else {
        setError(err.message || t("loginFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = () => {
    if (error) setError("");
  };

  

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store"><span className="brand-mark">U</span><span className="brand-text">URBA TECH <span>INTER</span></span></Link>
          <p>{t("accessAccountText")}</p>
        </div>
        {error && <div className="error-message" style={{ color: "#ffb3b3", marginBottom: "12px", fontSize: "14px" }}>{error}</div>}
        <form className="form-grid" onSubmit={submit}>
          <input className="input" name="email" type="email" placeholder={t("emailPlaceholder")} autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); handleInputChange(); }} required />
          <div className="password-wrapper">
            <input className="input" name="password" type={showPassword ? "text" : "password"} placeholder={t("passwordPlaceholder")} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); handleInputChange(); }} required />
            {password && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img src={showPassword ? EyeIcon : EyeOffIcon} alt="" />
              </button>
            )}
          </div>

          <button className="primary-btn full-width" type="submit" disabled={loading}>{loading ? t("loggingIn") : t("login")}</button>

          <button
            className="google-btn"
            type="button"
            onClick={() => {
              const next = encodeURIComponent(location.state?.next || "/store");
              window.location.href = `/api/auth/google?next=${next}&remember=${rememberMe ? 1 : 0}`;
            }}
          >
            <img src={GoogleLogo} alt="" className="btn-icon" aria-hidden />
            {t("continueWithGoogle")}
          </button>

          <button
            className="apple-btn"
            type="button"
            onClick={() => {
              const next = encodeURIComponent(location.state?.next || "/store");
              window.location.href = `/api/auth/apple?next=${next}&remember=${rememberMe ? 1 : 0}`;
            }}
          >
            <img src={AppleLogo} alt="" className="btn-icon" aria-hidden />
            {t("continueWithApple")}
          </button>

          <div className="remember-row">
            <label>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> {t("rememberMe")}
            </label>
            <Link className="link-button" to="/forgot-password">{t("forgotPassword")}</Link>
          </div>

        </form>
        <p className="auth-note">
          {t("dontHaveAccount")} <Link to="/signup" state={{ next: location.state?.next }}>{t("createOne")}</Link>
        </p>
        <Link className="secondary-btn auth-back-link" to="/store">{t("backToStore")}</Link>
      </section>
    </main>
  );
}
