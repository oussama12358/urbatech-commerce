import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createApiClient } from "../../shared/lib/api.js";

export default function ResetPasswordPage() {
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
      setMessage("Reset token is missing or invalid.");
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
      setError("Passwords do not match.");
      return false;
    }
    if (Object.values(passwordRules).includes(false)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.");
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
      setMessage(json.message || "Password reset successful. You can now log in.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/reset-success", { replace: true }), 2000);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Unable to reset password.");
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
            <h1>Reset password</h1>
            <p>Set a new password for your account.</p>
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
            <p>You will be redirected to login shortly.</p>
          </div>
        ) : (
          <form className="form-grid" onSubmit={submit}>
            <input
              className="input"
              name="password"
              type="password"
              placeholder="New password"
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
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              required
            />
            <div className="password-status">Password strength: <strong>{Object.values(passwordRules).filter(Boolean).length}/5</strong></div>
            <ul className="password-hint compact" aria-label="Password requirements">
              <li className={passwordRules.length ? "valid" : ""}>At least 8 characters</li>
              <li className={passwordRules.upper ? "valid" : ""}>Uppercase letter</li>
              <li className={passwordRules.lower ? "valid" : ""}>Lowercase letter</li>
              <li className={passwordRules.digit ? "valid" : ""}>Number</li>
              <li className={passwordRules.symbol ? "valid" : ""}>Symbol or punctuation</li>
            </ul>
            {error && <div className="error-message" style={{ color: "#ffb3b3" }}>{error}</div>}
            <button className="primary-btn" type="submit" disabled={loading || !token}>{loading ? "Resetting..." : "Reset password"}</button>
            <Link className="secondary-btn" to="/login">← Back to login</Link>
          </form>
        )}
      </section>
    </main>
  );
}
