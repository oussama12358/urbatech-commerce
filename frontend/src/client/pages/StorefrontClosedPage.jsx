import { Navigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function StorefrontClosedPage() {
  const { user } = useStore();
  useLocale();

  if (user?.role?.toLowerCase() === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <main className="main">
      <section className="panel storefront-closed">
        <h1>{t("storeClosedTitle")}</h1>
        <p className="lead">{t("storeClosedLead")}</p>
      </section>
    </main>
  );
}
