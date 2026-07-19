import { useEffect } from "react";
import AppRouter from "./router.jsx";
import { t, useLocale } from "../i18n.js";

export default function App() {
  const locale = useLocale();

  useEffect(() => {
    const handleInvalid = (event) => {
      const target = event.target;
      if (
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement) &&
        target.validity?.valueMissing
      ) {
        target.setCustomValidity(t("requiredField"));
        target.reportValidity();
      }
    };

    const handleInput = (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        target.setCustomValidity("");
      }
    };

    window.addEventListener("invalid", handleInvalid, true);
    window.addEventListener("input", handleInput, true);

    return () => {
      window.removeEventListener("invalid", handleInvalid, true);
      window.removeEventListener("input", handleInput, true);
    };
  }, [locale]);

  return <AppRouter />;
}
