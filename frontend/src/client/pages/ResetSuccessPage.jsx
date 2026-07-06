import { Link } from "react-router-dom";

export default function ResetSuccessPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <Link className="brand" to="/store">
            <span className="brand-mark">U</span>
            <span className="brand-text">URBA TECH <span>INTER</span></span>
          </Link>
          <div>
            <h1>Password updated</h1>
            <p>Your password has been changed successfully.</p>
          </div>
        </div>

        <div className="success-message" style={{ color: "#4CAF50", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ marginBottom: "8px" }}>Password Changed</h2>
          <p>You can now sign in using your new password.</p>
        </div>

        <Link className="primary-btn" to="/login" style={{ textAlign: "center", display: "block" }}>
          Go to Login
        </Link>
      </section>
    </main>
  );
}
