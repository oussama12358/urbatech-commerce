import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { createApiClient } from "../../shared/lib/api.js";

export default function VerifyEmailPage() {
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
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const api = createApiClient();
        const response = await api(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET"
        });

        setStatus("success");
        setMessage(response.message || "Email verified successfully!");

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
        setMessage(err.message || "Failed to verify email. The link may have expired.");
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
          <p>Email Verification</p>
        </div>

        {status === "verifying" && (
          <div className="loading">
            <p>Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-message" style={{ color: "#4CAF50", marginBottom: "20px" }}>
            <h3>✓ {message}</h3>
            <p>You will be redirected to the store shortly.</p>
          </div>
        )}

        {status === "error" && (
          <div className="error-message" style={{ color: "#ffb3b3", marginBottom: "20px" }}>
            <h3>✗ Verification Failed</h3>
            <p>{message}</p>
            <div style={{ marginTop: "20px" }}>
              <p>You can try:</p>
              <ul style={{ textAlign: "left", marginLeft: "20px" }}>
                <li>
                  <Link to="/login">Go to Login</Link> and request a new verification email
                </li>
                <li>
                  <Link to="/signup">Sign up again</Link> with a valid email
                </li>
              </ul>
            </div>
          </div>
        )}

        <Link className="secondary-btn" to="/store" style={{ marginTop: "20px" }}>
          ← Back to store
        </Link>
      </section>
    </main>
  );
}
