import { useLocale, t } from "../../i18n.js";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function AccountPage() {
  useLocale();
  const { user } = useStore();

  return (
    <main className="main">
      <Hero
        eyebrow={t("account")}
        title={t("accountOverview")}
        lead={t("manageYourProfile")}
      />

      <section className="panel account-panel">
        <div className="kv">
          <div className="kv-row"><span>{t("name")}</span><strong>{user?.name || "-"}</strong></div>
          <div className="kv-row"><span>{t("email")}</span><strong>{user?.email || "-"}</strong></div>
          <div className="kv-row"><span>{t("country")}</span><strong>{user?.country || user?.country_code || "-"}</strong></div>
        </div>
        <div className="panel-actions" style={{ marginTop: 16 }}>
          <Link className="secondary-btn" to="/logout">{t("logout")}</Link>
        </div>
      </section>
    </main>
  );
}
