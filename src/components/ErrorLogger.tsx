"use client";

import { useEffect } from "react";

// Catches uncaught browser errors + unhandled promise rejections and reports them
// to /api/log-error (fire-and-forget via sendBeacon). Deduped per session so a
// repeating error is reported once. Production only. Renders nothing.
export default function ErrorLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const seen = new Set<string>();
    function report(message?: string, stack?: string) {
      if (!message) return;
      const key = message.slice(0, 200);
      if (seen.has(key)) return;
      seen.add(key);
      const payload = JSON.stringify({ message, stack, path: location.pathname });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (!navigator.sendBeacon?.("/api/log-error", blob)) {
          fetch("/api/log-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }

    const onError = (e: ErrorEvent) => report(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) =>
      report(String(e.reason?.message ?? e.reason), e.reason?.stack);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
