import { Restaurant } from "@/lib/types";
import type { ExplorerSort, ExplorerPreferences } from "@/hooks/usePreferences";
import type { MapFilters } from "@/lib/types";

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

export function filterExplorerResults(
  pool: Restaurant[],
  query: string,
  prefs: ExplorerPreferences,
  favoriteCountries: Set<string>,
): Restaurant[] {
  const search = query.trim().toLowerCase();
  const matches = pool.filter((restaurant) => {
    if (search) {
      const haystack = [
        restaurant.name,
        restaurant.country,
        restaurant.specialty,
        restaurant.address,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (prefs.cuisine && restaurant.country !== prefs.cuisine) {
      return false;
    }
    if ((restaurant.rating ?? 0) < prefs.minRating) return false;
    if (prefs.hasWebsite && !restaurant.website) return false;
    return true;
  });

  const sorters: Record<
    ExplorerSort,
    (a: Restaurant, b: Restaurant) => number
  > = {
    recommended: (a, b) =>
      scoreRestaurantForRecommendations(b, {
        favoriteCountries,
      }) -
      scoreRestaurantForRecommendations(a, {
        favoriteCountries,
      }),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    newest: (a, b) => Number(b.id) - Number(a.id),
    distance: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  };

  const sortBy = prefs.sortBy === "distance" ? "recommended" : prefs.sortBy;
  return matches.sort(sorters[sortBy]);
}

export function filterMapRestaurants(
  restaurants: Restaurant[],
  filters: MapFilters,
  favoriteCountries: Set<string>,
): Restaurant[] {
  const base = restaurants.filter((restaurant) => {
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
