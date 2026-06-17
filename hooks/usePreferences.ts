import { useState, useEffect, useCallback } from "react";
import type { MapFilters } from "@/lib/types";

export type ExplorerSort = "recommended" | "rating" | "distance" | "newest";

export interface ExplorerPreferences {
  cuisine: string;
  minRating: number;
  hasWebsite: boolean;
  sortBy: ExplorerSort;
}

const DEFAULT_EXPLORER_PREFS: ExplorerPreferences = {
  cuisine: "",
  minRating: 0,
  hasWebsite: false,
  sortBy: "recommended",
};

const DEFAULT_MAP_FILTERS: MapFilters = {
  cuisine: "",
  minRating: 0,
  sortBy: "recommended",
};

function loadJsonState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

export function useExplorerPreferences() {
  const [prefs, setPrefs] = useState<ExplorerPreferences>(() =>
    loadJsonState("cdm-explorer-prefs", DEFAULT_EXPLORER_PREFS),
  );

  useEffect(() => {
    try {
      localStorage.setItem("cdm-explorer-prefs", JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const updatePrefs = useCallback((next: Partial<ExplorerPreferences>) => {
    setPrefs((current) => ({ ...current, ...next }));
  }, []);

  const reset = useCallback(() => {
    setPrefs(DEFAULT_EXPLORER_PREFS);
  }, []);

  return { prefs, updatePrefs, reset };
}

export function useMapFilters() {
  const [filters, setFilters] = useState<MapFilters>(() =>
    loadJsonState("cdm-map-filters", DEFAULT_MAP_FILTERS),
  );

  useEffect(() => {
    try {
      localStorage.setItem("cdm-map-filters", JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  const updateFilters = useCallback((next: Partial<MapFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);

  return { filters, updateFilters };
}
