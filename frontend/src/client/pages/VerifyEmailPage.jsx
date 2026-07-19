import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";
import { t, useLocale } from "../../i18n.js";

export default function VerifyEmailPage() {
  useLocale();
  const [searchParams] = useSearchParams();
  const { login } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage(t("verificationTokenMissing"));
        return;
      }

      try {
        const api = createApiClient();
        const response = await api(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET"
        });

        setStatus("success");
        setMessage(response.message || t("emailVerifiedSuccessfully"));

        // Auto-login the user
        if (response.user && response.token) {
          await login({ ...response.user, token: response.token });
          // Redirect to store after 4 seconds (give user time to read)
          setTimeout(() => {
            navigate("/store", { replace: true });
          }, 4000);
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.message || t("failedEmailVerification"));
      }
    };

    verifyEmail();
  }, [searchParams, login, navigate]);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store">
            <span className="brand-mark">U</span>
            <span className="brand-text">
              URBA TECH <span>INTER</span>
            </span>
          </Link>
          <p>{t("emailVerificationTitle")}</p>
        </div>

        {status === "verifying" && (
          <div className="loading">
            <p>{t("verifyingEmail")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-message" style={{ color: "#4CAF50", marginBottom: "20px" }}>
            <h3>✓ {message}</h3>
            <p>{t("redirectToStoreSoon")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="error-message" style={{ color: "#ffb3b3", marginBottom: "20px" }}>
            <h3>✗ {t("verificationFailedTitle")}</h3>
            <p>{message}</p>
            <div style={{ marginTop: "20px" }}>
              <p>{t("verificationTryAgain")}</p>
              <ul style={{ textAlign: "left", marginLeft: "20px" }}>
                <li>
                  <Link to="/login">{t("goToLogin")}</Link> {t("andRequestNewVerificationEmail")}
                </li>
                <li>
                  <Link to="/signup">{t("signUpAgain")}</Link> {t("withAValidEmail")}
                </li>
              </ul>
            </div>
          </div>
        )}

        <Link className="secondary-btn" to="/store" style={{ marginTop: "20px" }}>
          {t("backToStore")}
        </Link>
      </section>
    </main>
  );
}
