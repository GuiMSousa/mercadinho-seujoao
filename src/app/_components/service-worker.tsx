"use client";

import { useEffect } from "react";

/** Registers /sw.js in production; browsers refuse it outside HTTPS or localhost. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // The app works the same without it, so a refusal only costs the install prompt.
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
