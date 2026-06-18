import type { Paginated, Restaurant, RestaurantStats } from "./types";

/**
 * Appels à l'API interne Next.js (Route Handlers sous /api).
 * Les cookies de session Supabase sont envoyés automatiquement (same-origin).
 */

export interface RestaurantFilters {
  cuisine?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minRating?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  spotlight?: boolean;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Requête ${url} échouée (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRestaurants(
  filters: RestaurantFilters = {},
): Promise<Paginated<Restaurant>> {
  const params = new URLSearchParams();
  if (filters.cuisine) params.set("cuisine", filters.cuisine);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.minRating != null && filters.minRating > 0) {
    params.set("minRating", String(filters.minRating));
  }
  if (filters.hasWebsite) params.set("hasWebsite", "true");
  if (filters.hasPhone) params.set("hasPhone", "true");
  if (filters.spotlight) params.set("spotlight", "true");
  const qs = params.toString();
  return getJson<Paginated<Restaurant>>(
    `/api/restaurants${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchStats(): Promise<RestaurantStats> {
  return getJson<RestaurantStats>("/api/restaurants/stats");
}

export async function fetchCuisines(): Promise<string[]> {
  return getJson<string[]>("/api/restaurants/cuisines");
}

export async function fetchRestaurant(id: string): Promise<Restaurant> {
  return getJson<Restaurant>(`/api/restaurants/${id}`);
}

export async function rateRestaurant(
  id: string,
  rating: number,
): Promise<Restaurant> {
  const res = await fetch(`/api/restaurants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Requête /api/restaurants/${id} échouée (${res.status}): ${body}`);
  }
  return res.json() as Promise<Restaurant>;
}
