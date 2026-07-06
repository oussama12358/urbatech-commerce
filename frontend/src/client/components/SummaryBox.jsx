import { money } from "../../shared/lib/format.js";

export default function SummaryBox({ totals }) {
  return (
    <div className="summary">
      <div className="summary-row">
        <span>Subtotal</span>
        <strong>{money(totals.subtotal)}</strong>
      </div>
      <div className="summary-row">
        <span>Service fee</span>
        <strong>{money(totals.service)}</strong>
      </div>
      <div className="summary-row">
        <span>Estimated shipping</span>
        <strong>{money(totals.shipping)}</strong>
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <strong>{money(totals.total)}</strong>
      </div>
    </div>
  );
}
