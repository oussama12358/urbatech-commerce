import { money } from "../../shared/lib/format.js";
import { t, useLocale } from "../../i18n.js";

export default function SummaryBox({ totals }) {
  useLocale();

  return (
    <div className="summary">
      <div className="summary-row">
        <span>{t("subtotal")}</span>
        <strong>{money(totals.subtotal)}</strong>
      </div>
      <div className="summary-row">
        <span>{t("estimatedShipping")}</span>
        <strong>{money(totals.shipping)}</strong>
      </div>
      <div className="summary-row total">
        <span>{t("total")}</span>
        <strong>{money(totals.total)}</strong>
      </div>
    </div>
  );
}
