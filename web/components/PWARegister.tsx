"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (uniquement en production pour éviter
 * les soucis de cache en développement).
 */
export default function PWARegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // échec silencieux : l'app fonctionne sans SW
      });
    }
  }, []);

  return null;
}
