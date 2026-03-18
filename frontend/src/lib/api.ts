const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Restaurant {
  id: number;
  name: string;
  cuisine?: string | null;
  address?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  phone?: string | null;
}

export interface RestaurantsResponse {
  data: Restaurant[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StatsResponse {
  total: number;
  byCuisine: { cuisine: string | null; count: number }[];
}
