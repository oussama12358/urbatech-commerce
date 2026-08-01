import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function LogoutPage() {
  const { logout } = useStore();
  const navigate = useNavigate();
  useLocale();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => navigate("/login"), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand" to="/store"><span className="brand-mark">UTI</span><span className="brand-text">URBA TECH <span>INTER</span></span></Link>
        <h1>{t("loggedOut")}</h1>
        <p>{t("logoutMessage")}</p>
      </section>
    </main>
  );
}
