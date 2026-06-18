/** Ligne telle que stockée dans la table Supabase `restaurants`. */
export interface DbRestaurant {
  id: number;
  name: string;
  rating: number | null;
  cuisine: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  url?: string | null;
  phone: string | null;
  source: string | null;
  source_id: string | null;
  is_active: boolean;
  boost_until?: string | null;
  boost_tier?: number;
  created_at: string;
  updated_at: string;
}

/** Note d'un membre du cercle (feature locale, non persistée en base pour l'instant). */
export interface FriendRating {
  name: string;
  avatar: string;
  rating: number;
}

/** Modèle utilisé par l'UI. */
export interface Restaurant {
  id: string;
  name: string;
  country: string;
  address: string;
  imageUrl: string;
  specialty: string;
  description: string;
  rating?: number;
  website?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  friendRatings?: FriendRating[];
  /** Fin du boost payant (ISO). Visible admin uniquement côté API brute. */
  boostUntil?: string | null;
  boostTier?: number;
  /** Boost actif + restaurant moins connu. */
  isSpotlight?: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RestaurantStats {
  total: number;
  byCuisine: { cuisine: string | null; count: number }[];
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type SortMode = "recommended" | "rating" | "distance" | "newest";

export interface ExplorerFilters {
  cuisine: string;
  minRating: number;
  hasWebsite: boolean;
  sortBy: SortMode;
}

export interface MapFilters {
  continent: string;
  cuisine: string;
  minRating: number;
  sortBy: "recommended" | "rating" | "distance" | "popular";
}
