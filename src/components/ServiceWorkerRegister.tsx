"use client";

import { useEffect } from "react";

// Registers the PWA service worker (production only — skipping dev avoids caching
// headaches while developing). Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
