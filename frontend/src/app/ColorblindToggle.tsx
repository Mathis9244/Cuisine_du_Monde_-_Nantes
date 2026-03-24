'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'colorblindModeEnabled';

export function ColorblindToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === 'true';
    setEnabled(saved);
    document.documentElement.classList.toggle('colorblind-mode', saved);
  }, []);

  const toggleMode = () => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      document.documentElement.classList.toggle('colorblind-mode', next);
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleMode}
      className="colorblind-toggle"
      aria-pressed={enabled}
      aria-label={enabled ? 'Désactiver le mode daltonien' : 'Activer le mode daltonien'}
      title={enabled ? 'Désactiver le mode daltonien' : 'Activer le mode daltonien'}
    >
      {enabled ? 'Mode daltonien: ON' : 'Mode daltonien: OFF'}
    </button>
  );
}
