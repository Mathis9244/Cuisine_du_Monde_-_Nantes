import type { GeoPoint, Restaurant } from "@/lib/types";
import type { ExplorerSort, ExplorerPreferences } from "@/hooks/usePreferences";
import type { MapFilters } from "@/lib/types";
import { getContinentForCountry } from "@/lib/continents";
import { haversineKm } from "@/lib/geo";
import { restaurantMatchesSearch } from "@/lib/searchUtils";
import { spotlightScoreBonus } from "@/lib/visibility";

export const EXPLORER_NEARBY_RADIUS_KM = 5;

export function scoreRestaurantForRecommendations(
  restaurant: Restaurant,
  opts: {
    favoriteCountries: Set<string>;
  },
): number {
  let score = restaurant.rating ?? 0;
  if (restaurant.website) score += 0.2;
  score += Math.min(0.6, (restaurant.friendRatings?.length ?? 0) * 0.12);
  if (opts.favoriteCountries.has(restaurant.country)) score += 0.8;
  score += spotlightScoreBonus(restaurant);
  return score;
}

export function filterRestaurantsByFeedFilter(
  restaurants: Restaurant[],
  filter: "all" | "top" | "reviews" | "website",
): Restaurant[] {
  return restaurants.filter((restaurant) => {
    if (filter === "top") {
      return (restaurant.rating ?? 0) >= 4.2;
    }
    if (filter === "reviews") {
      return (restaurant.friendRatings?.length ?? 0) > 0;
    }
    if (filter === "website") {
      return Boolean(restaurant.website);
    }
    return true;
  });
}

function distanceKm(
  restaurant: Restaurant,
  userLocation: GeoPoint | null | undefined,
): number | null {
  if (
    !userLocation ||
    restaurant.latitude == null ||
    restaurant.longitude == null
  ) {
    return null;
  }
  return haversineKm(userLocation, {
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
  });
}

export interface ExplorerFilterContext {
  favoriteCountries: Set<string>;
  userLocation?: GeoPoint | null;
}

export function filterExplorerResults(
  pool: Restaurant[],
  query: string,
  prefs: ExplorerPreferences,
  context: ExplorerFilterContext,
): Restaurant[] {
  const matches = pool.filter((restaurant) => {
    if (!restaurantMatchesSearch(restaurant, query)) return false;

    if (
      prefs.continent &&
      getContinentForCountry(restaurant.country) !== prefs.continent
    ) {
      return false;
    }
    if (prefs.cuisine && restaurant.country !== prefs.cuisine) {
      return false;
    }
    if ((restaurant.rating ?? 0) < prefs.minRating) return false;
    if (prefs.hasWebsite && !restaurant.website) return false;
    if (prefs.hasPhone && !restaurant.phone?.trim()) return false;
    if (prefs.hasReviews && (restaurant.friendRatings?.length ?? 0) === 0) {
      return false;
    }
    if (prefs.nearbyOnly) {
      const km = distanceKm(restaurant, context.userLocation);
      if (km == null || km > EXPLORER_NEARBY_RADIUS_KM) return false;
    }
    return true;
  });

  const sorters: Record<
    ExplorerSort,
    (a: Restaurant, b: Restaurant) => number
  > = {
    recommended: (a, b) =>
      scoreRestaurantForRecommendations(b, {
        favoriteCountries: context.favoriteCountries,
      }) -
      scoreRestaurantForRecommendations(a, {
        favoriteCountries: context.favoriteCountries,
      }),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    newest: (a, b) => Number(b.id) - Number(a.id),
    distance: (a, b) => {
      const da = distanceKm(a, context.userLocation);
      const db = distanceKm(b, context.userLocation);
      if (da == null && db == null) return (b.rating ?? 0) - (a.rating ?? 0);
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    },
  };

  return matches.sort(sorters[prefs.sortBy]);
}

export function countActiveExplorerFilters(
  prefs: ExplorerPreferences,
  query: string,
): number {
  let count = 0;
  if (query.trim()) count += 1;
  if (prefs.continent) count += 1;
  if (prefs.cuisine) count += 1;
  if (prefs.minRating > 0) count += 1;
  if (prefs.hasWebsite) count += 1;
  if (prefs.hasPhone) count += 1;
  if (prefs.hasReviews) count += 1;
  if (prefs.nearbyOnly) count += 1;
  return count;
}

export function filterMapRestaurants(
  restaurants: Restaurant[],
  filters: MapFilters,
  favoriteCountries: Set<string>,
): Restaurant[] {
  const base = restaurants.filter((restaurant) => {
    if (
      filters.continent &&
      getContinentForCountry(restaurant.country) !== filters.continent
    ) {
      return false;
    }
    if (filters.cuisine && restaurant.country !== filters.cuisine) {
      return false;
    }
    if ((restaurant.rating ?? 0) < filters.minRating) return false;
    return true;
  });

  const sorters: Record<
    MapFilters["sortBy"],
    (a: Restaurant, b: Restaurant) => number
  > = {
    recommended: (a, b) =>
      scoreRestaurantForRecommendations(b, { favoriteCountries }) -
      scoreRestaurantForRecommendations(a, { favoriteCountries }),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    popular: (a, b) =>
      (b.friendRatings?.length ?? 0) - (a.friendRatings?.length ?? 0) ||
      (b.rating ?? 0) - (a.rating ?? 0),
    distance: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  };

  const sortBy = filters.sortBy === "distance" ? "recommended" : filters.sortBy;
  return base.sort(sorters[sortBy]);
}

export function explorerApiSort(
  sortBy: ExplorerSort,
): { sortBy: string; sortOrder: "asc" | "desc" } {
  switch (sortBy) {
    case "rating":
      return { sortBy: "rating", sortOrder: "desc" };
    case "newest":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "distance":
      return { sortBy: "name", sortOrder: "asc" };
    default:
      return { sortBy: "rating", sortOrder: "desc" };
  }
}
