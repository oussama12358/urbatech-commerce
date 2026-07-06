import React, { useEffect, useState } from "react";
import { subscribe, removeToast } from "../lib/toast";

export default function GlobalToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (evt.type === "add") setToasts((t) => [evt.toast, ...t]);
      if (evt.type === "remove") setToasts((t) => t.filter((x) => x.id !== evt.id));
    });
    return unsub;
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", right: 16, top: 16, zIndex: 9999 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ marginBottom: 8, padding: "8px 12px", background: "#222", color: "#fff", borderRadius: 6 }}>
          <div style={{ fontSize: 14 }}>{t.message}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{t.type}</div>
        </div>
      ))}
    </div>
  );
}
