import { Link } from "react-router-dom";
import { Globe, LogOut, UserRound } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";
import { getLocale, setLocale, t, availableLocales, useLocale } from "../../i18n.js";

export default function Topbar() {
  const { user } = useStore();
  useLocale();

  const displayName = user?.name?.split(" ")[0] || t("account");
  const handleLanguageChange = (event) => {
    setLocale(event.target.value);
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <div className="admin-topbar-title">
          <p className="eyebrow">{t("adminWorkspace")}</p>
          <h1>{t("commerceOperations")}</h1>
        </div>

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
      </div>

      <div className="admin-topbar-right">
        <div className="actions">
          <span className="icon-btn avatar-pill" title={displayName}>
            <UserRound />
            {displayName}
            <span className="avatar-caret">▼</span>
          </span>
          <Link className="icon-btn" to="/logout" aria-label={t("logout") }>
            <LogOut />
          </Link>
        </div>
      </div>
    </header>
  );
}
