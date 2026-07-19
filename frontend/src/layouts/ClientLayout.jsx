import { Link, NavLink, Outlet } from "react-router-dom";
import { Globe, LogIn, ShoppingCart, UserRound } from "lucide-react";
import { useStore } from "../store/StoreContext.jsx";
import Footer from "../client/components/Footer.jsx";
import GlobalToast from "../shared/components/GlobalToast.jsx";
import { getLocale, setLocale, t, availableLocales, useLocale } from "../i18n.js";

export default function ClientLayout() {
  const { cartCount, user, settings } = useStore();
  useLocale();
  const handleLanguageChange = (event) => {
    setLocale(event.target.value);
  };

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/store">
          <div className="brand-mark">U</div>
          <div className="brand-text">
            <strong>URBA TECH</strong>
            <span>INTER</span>
          </div>
        </Link>

        <div className="language-switcher language-pill">
          <button type="button" className="language-pill-btn" aria-haspopup="listbox" aria-expanded="false">
            <Globe />
            {availableLocales.find((locale) => locale.key === getLocale())?.label}
          </button>
          <select className="select language-select" value={getLocale()} onChange={handleLanguageChange}>
            {availableLocales.map((locale) => (
              <option key={locale.key} value={locale.key}>
                {locale.label}
              </option>
            ))}
          </select>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {settings.storefrontEnabled && <NavLink to="/store">{t("store")}</NavLink>}
          {user && <NavLink to="/orders">{t("orders")}</NavLink>}
          {user && <NavLink to="/account">{t("account")}</NavLink>}
        </nav>

        <div className="actions">
          <Link className="icon-btn" to={user ? "/account" : "/login"}>
            {user ? <UserRound /> : <LogIn />}
            {user ? user.name.split(" ")[0] : t("login")}
          </Link>
          {settings.storefrontEnabled && (
            <Link className="primary-btn" to="/cart">
              <ShoppingCart />
              {t("cart")} <span>{cartCount}</span>
            </Link>
          )}
        </div>
      </header>

      <div className="page-wrap">
        <Outlet />
      </div>

      <Footer />
      <GlobalToast />
    </div>
  );
}
