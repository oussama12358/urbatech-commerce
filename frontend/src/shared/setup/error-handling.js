import { showToast } from "../lib/toast.js";

window.addEventListener("unhandledrejection", (ev) => {
  try {
    const reason = ev.reason;
    const message = reason && reason.message ? reason.message : String(reason);
    showToast(message || "An unexpected error occurred.", "error");
  } catch (e) {
    // fallback to console
    // eslint-disable-next-line no-console
    console.error("Error in unhandledrejection handler", e);
  }
});

window.addEventListener("error", (ev) => {
  try {
    const message = ev.error && ev.error.message ? ev.error.message : ev.message || "An unexpected error occurred.";
    showToast(message, "error");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error in window.onerror handler", e);
  }
});
