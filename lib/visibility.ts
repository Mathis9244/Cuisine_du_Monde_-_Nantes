import type { Restaurant } from "@/lib/types";

/** Seuils : restaurant « moins connu » = peu noté dans le cercle. */
export const LESS_KNOWN_MAX_RATING = 4.25;
export const LESS_KNOWN_MAX_CIRCLE_REVIEWS = 2;

export function isLessKnownRestaurant(restaurant: Restaurant): boolean {
  const reviews = restaurant.friendRatings?.length ?? 0;
  const rating = restaurant.rating ?? 0;
  return (
    rating < LESS_KNOWN_MAX_RATING && reviews <= LESS_KNOWN_MAX_CIRCLE_REVIEWS
  );
}

export function isRestaurantBoosted(restaurant: Restaurant): boolean {
  if (!restaurant.boostUntil) return false;
  return new Date(restaurant.boostUntil).getTime() > Date.now();
}

/** Boost actif réservé aux pépites moins connues (offre payante). */
export function isActiveSpotlight(restaurant: Restaurant): boolean {
  return isRestaurantBoosted(restaurant) && isLessKnownRestaurant(restaurant);
}

export function spotlightScoreBonus(restaurant: Restaurant): number {
  if (!isActiveSpotlight(restaurant)) return 0;
  const tier = restaurant.boostTier ?? 1;
  return 0.9 + tier * 0.35;
}

export function sortSpotlightRestaurants(restaurants: Restaurant[]): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    const tierDiff = (b.boostTier ?? 1) - (a.boostTier ?? 1);
    if (tierDiff !== 0) return tierDiff;
    const aUntil = a.boostUntil ? new Date(a.boostUntil).getTime() : 0;
    const bUntil = b.boostUntil ? new Date(b.boostUntil).getTime() : 0;
    return bUntil - aUntil;
  });
}

export function boostExpiryFromDays(days: number): string {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return until.toISOString();
}
