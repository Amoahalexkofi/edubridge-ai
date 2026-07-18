"use client";

import { useEffect } from "react";

// The build id baked into THIS running copy of the app.
const CURRENT = process.env.NEXT_PUBLIC_BUILD_ID;

// Registers the PWA service worker AND keeps the app up to date: it checks the
// deployed build id and refreshes when a newer version is live — so an installed
// PWA never gets stuck on an old version. Production only.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    window.addEventListener("load", onLoad);

    let pending = false;
    async function check() {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { build } = await r.json();
        if (build && CURRENT && build !== CURRENT) pending = true;
      } catch {
        /* offline / transient — try again next time */
      }
    }

    // Reload to the new version when the app opens or is brought back to the
    // foreground (non-disruptive: never interrupts active use mid-session).
    async function refreshIfStale() {
      if (document.visibilityState !== "visible") return;
      await check();
      if (pending) window.location.reload();
    }

    refreshIfStale(); // on first load
    const iv = setInterval(check, 5 * 60 * 1000); // catch long-open sessions
    document.addEventListener("visibilitychange", refreshIfStale);

    return () => {
      window.removeEventListener("load", onLoad);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, []);

  return null;
}
