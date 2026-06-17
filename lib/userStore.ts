/** Stockage local des notes et préférences utilisateur (côté client). */

const RATINGS_KEY = "nwe-ratings-store";
const EXCLUDED_KEY = "cdm-excluded-countries";

export function getRatingsStore(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function getRatedRestaurantIds(): string[] {
  return Object.keys(getRatingsStore());
}

function readExcludedMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EXCLUDED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeExcludedMap(map: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXCLUDED_KEY, JSON.stringify(map));
}

export function getExcludedCountries(userId: string): string[] {
  if (!userId) return [];
  return readExcludedMap()[userId] ?? [];
}

export function addExcludedCountry(userId: string, country: string): string[] {
  if (!userId || !country) return [];
  const map = readExcludedMap();
  const current = new Set(map[userId] ?? []);
  current.add(country);
  const next = Array.from(current).sort();
  map[userId] = next;
  writeExcludedMap(map);
  return next;
}

export function removeExcludedCountry(userId: string, country: string): string[] {
  if (!userId) return [];
  const map = readExcludedMap();
  const next = (map[userId] ?? []).filter((c) => c !== country);
  if (next.length === 0) delete map[userId];
  else map[userId] = next;
  writeExcludedMap(map);
  return next;
}

export function setExcludedCountries(userId: string, countries: string[]): string[] {
  if (!userId) return [];
  const map = readExcludedMap();
  const next = Array.from(new Set(countries)).sort();
  if (next.length === 0) delete map[userId];
  else map[userId] = next;
  writeExcludedMap(map);
  return next;
}
