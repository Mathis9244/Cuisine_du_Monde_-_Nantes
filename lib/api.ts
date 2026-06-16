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
