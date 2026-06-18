import type { Restaurant } from "@/lib/types";

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function tokenizeSearchQuery(query: string): string[] {
  return normalizeSearchText(query).split(/\s+/).filter(Boolean);
}

export function getRestaurantSearchHaystack(restaurant: Restaurant): string {
  return normalizeSearchText(
    [
      restaurant.name,
      restaurant.country,
      restaurant.specialty,
      restaurant.description,
      restaurant.address,
      restaurant.website ?? "",
      restaurant.phone ?? "",
    ].join(" "),
  );
}

/** Chaque mot de la requête doit apparaître dans au moins un champ du restaurant. */
export function restaurantMatchesSearch(
  restaurant: Restaurant,
  query: string,
): boolean {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return true;
  const haystack = getRestaurantSearchHaystack(restaurant);
  const compactHaystack = haystack.replace(/\s+/g, "");
  return tokens.every((token) => {
    const compactToken = token.replace(/\s+/g, "");
    return (
      haystack.includes(token) ||
      (compactToken.length > 0 && compactHaystack.includes(compactToken))
    );
  });
}
