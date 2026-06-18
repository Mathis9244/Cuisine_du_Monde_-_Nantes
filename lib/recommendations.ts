import type { Restaurant } from "@/lib/types";
import { getContinentForCountry } from "@/lib/continents";
import { getRatingsStore } from "@/lib/userStore";
import { isActiveSpotlight, spotlightScoreBonus } from "@/lib/visibility";
export type RecommendationReasonKey =
  | "liked_country"
  | "liked_continent"
  | "top_rated"
  | "new_for_you"
  | "popular"
  | "spotlight";

export interface TasteProfile {
  likedCountries: Set<string>;
  likedContinents: Set<string>;
  ratedIds: Set<string>;
  excludedCountries: Set<string>;
}

export interface ScoredRecommendation {
  restaurant: Restaurant;
  score: number;
  reason: RecommendationReasonKey;
  reasonCountry?: string;
  reasonContinent?: string;
}

export function buildTasteProfile(opts: {
  pool: Restaurant[];
  excludedCountries?: string[];
}): TasteProfile {
  const store = getRatingsStore();
  const ratedIds = new Set(Object.keys(store));
  const likedCountries = new Set<string>();
  const likedContinents = new Set<string>();

  for (const restaurant of opts.pool) {
    const userRating = store[restaurant.id];
    if (userRating == null) continue;
    if (userRating >= 3.5) {
      likedCountries.add(restaurant.country);
      likedContinents.add(getContinentForCountry(restaurant.country));
    }
  }

  return {
    likedCountries,
    likedContinents,
    ratedIds,
    excludedCountries: new Set(opts.excludedCountries ?? []),
  };
}

function pickReason(
  restaurant: Restaurant,
  profile: TasteProfile,
): Pick<ScoredRecommendation, "reason" | "reasonCountry" | "reasonContinent"> {
  const continent = getContinentForCountry(restaurant.country);
  const alreadyRated = profile.ratedIds.has(restaurant.id);

  if (isActiveSpotlight(restaurant)) {
    return { reason: "spotlight" };
  }
  if (
    !alreadyRated &&
    profile.likedCountries.has(restaurant.country)
  ) {
    return { reason: "liked_country", reasonCountry: restaurant.country };
  }
  if (
    !alreadyRated &&
    profile.likedContinents.has(continent)
  ) {
    return { reason: "liked_continent", reasonContinent: continent };
  }
  if ((restaurant.rating ?? 0) >= 4.3) {
    return { reason: "top_rated" };
  }
  if (!alreadyRated) {
    return { reason: "new_for_you" };
  }
  return { reason: "popular" };
}

export function scoreRestaurantForUser(
  restaurant: Restaurant,
  profile: TasteProfile,
  favoriteCountries: Set<string>,
): number {
  if (profile.excludedCountries.has(restaurant.country)) return -10;

  let score = restaurant.rating ?? 0;

  if (restaurant.website) score += 0.2;
  score += Math.min(0.6, (restaurant.friendRatings?.length ?? 0) * 0.12);

  if (favoriteCountries.has(restaurant.country)) score += 0.6;
  if (profile.likedCountries.has(restaurant.country)) score += 1.4;
  if (profile.likedContinents.has(getContinentForCountry(restaurant.country))) {
    score += 0.7;
  }

  if (profile.ratedIds.has(restaurant.id)) {
    score -= 1.5;
  } else if (profile.likedCountries.size > 0) {
    score += 0.35;
  }

  score += spotlightScoreBonus(restaurant);

  return score;
}

export function getRecommendations(
  pool: Restaurant[],
  profile: TasteProfile,
  favoriteCountries: Set<string>,
  limit = 8,
): ScoredRecommendation[] {
  const seen = new Set<string>();
  const unique = pool.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return unique
    .map((restaurant) => {
      const score = scoreRestaurantForUser(
        restaurant,
        profile,
        favoriteCountries,
      );
      const reasonMeta = pickReason(restaurant, profile);
      return { restaurant, score, ...reasonMeta };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
