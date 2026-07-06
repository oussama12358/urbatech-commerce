import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";

export default function LogoutPage() {
  const { logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => navigate("/login"), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand" to="/store"><span className="brand-mark">U</span><span className="brand-text">URBA TECH <span>INTER</span></span></Link>
        <h1>Logged out</h1>
        <p>Your session is closed. Redirecting to login...</p>
      </section>
    </main>
  );
}
