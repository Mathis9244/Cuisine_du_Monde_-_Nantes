"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: Resolved;
  setPreference: (p: ThemePreference) => void;
  cycle: () => void;
}

const STORAGE_KEY = "cdm-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(pref: ThemePreference): Resolved {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

function apply(resolved: Resolved) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemePreference) || "system";
    setPreferenceState(stored);
    const r = resolve(stored);
    setResolved(r);
    apply(r);
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: Resolved = mq.matches ? "dark" : "light";
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    localStorage.setItem(STORAGE_KEY, p);
    const r = resolve(p);
    setResolved(r);
    apply(r);
  }, []);

  const cycle = useCallback(() => {
    const order: ThemePreference[] = ["system", "light", "dark"];
    setPreference(order[(order.indexOf(preference) + 1) % order.length]);
  }, [preference, setPreference]);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans <ThemeProvider>");
  return ctx;
}

/** Script injecté avant l'hydratation pour éviter le flash de thème (FOUC). */
export const themeNoFlashScript = `
(function() {
  try {
    var p = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var dark = p === 'dark' || (p === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
