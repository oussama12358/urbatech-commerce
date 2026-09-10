import { money } from "../../shared/lib/format.js";
import { t } from "../../i18n.js";

export default function SummaryBox({ totals }) {
  return (
    <div className="summary">
      <div className="summary-row total">
        <span>{t("total")}</span>
        <strong>{money(totals.total, totals.currency)}</strong>
      </div>
    </div>
  );
}
