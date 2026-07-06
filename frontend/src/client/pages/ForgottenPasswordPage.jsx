import { useState } from "react";
import { Link } from "react-router-dom";
import { createApiClient } from "../../shared/lib/api.js";

export default function ForgottenPasswordPage() {
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
      setMessage(json.message || "If an account exists and supports password login, we'll send you a password reset email.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Unable to send reset link.");
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
            <h1>Forgotten password</h1>
            <p>Enter your email and we’ll send instructions to reset your password.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={submit}>
          <input
            className="input"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</button>
          <Link className="secondary-btn" to="/login">← Back to login</Link>
        </form>
      </section>
    </main>
  );
}
