import { t } from "../../i18n.js";

export default function NotFound() {
  return (
    <main className="main">
      <div className="empty">{t("pageNotFound")}</div>
    </main>
  );
}
