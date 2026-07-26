"use client";

import { useEffect } from "react";

/**
 * Registers the minimal install-eligibility service worker (public/sw.js).
 * No offline caching is performed — this exists purely so Chrome/Android
 * recognizes the app as installable. Renders nothing.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Falha ao registrar o service worker:", error);
    });
  }, []);

  return null;
}
