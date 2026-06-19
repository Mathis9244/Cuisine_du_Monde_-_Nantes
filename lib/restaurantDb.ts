import type { DbRestaurant } from "@/lib/types";

type RestaurantUrlSource = {
  website?: string | null;
  url?: string | null;
  name?: string;
  address?: string | null;
  city?: string | null;
};

/** URL affichée / éditée (schéma `website` ou legacy `url`). */
export function dbWebsite(row: RestaurantUrlSource): string | null {
  const value = row.website?.trim() || row.url?.trim();
  return value || null;
}

/** Valeur pour la colonne NOT NULL `url` en base legacy. */
export function resolveRestaurantUrl(row: RestaurantUrlSource): string {
  const explicit = dbWebsite(row);
  if (explicit) return explicit;

  const query = [row.name, row.address, row.city].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "restaurant Nantes")}`;
}

export function buildRestaurantInsertRow(
  body: Partial<DbRestaurant> & { name: string },
): Record<string, unknown> {
  const url = resolveRestaurantUrl(body);

  return {
    name: body.name.trim(),
    rating: body.rating ?? null,
    cuisine: body.cuisine?.trim() || null,
    address: body.address?.trim() || null,
    city: body.city?.trim() || "Nantes",
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    phone: body.phone?.trim() || null,
    source: body.source ?? "manual",
    is_active: true,
    url,
  };
}

export function buildRestaurantUpdateRow(
  body: Partial<DbRestaurant>,
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if ("name" in body && body.name != null) update.name = body.name.trim();
  if ("rating" in body) update.rating = body.rating ?? null;
  if ("cuisine" in body) update.cuisine = body.cuisine?.trim() || null;
  if ("address" in body) update.address = body.address?.trim() || null;
  if ("city" in body) update.city = body.city?.trim() || "Nantes";
  if ("latitude" in body) update.latitude = body.latitude ?? null;
  if ("longitude" in body) update.longitude = body.longitude ?? null;
  if ("phone" in body) update.phone = body.phone?.trim() || null;

  if ("website" in body || "url" in body) {
    update.url = resolveRestaurantUrl({
      website: body.website,
      url: body.url,
      name: body.name,
      address: body.address,
      city: body.city,
    });
  }

  return update;
}

/** Normalise une ligne Supabase pour l'admin (website ← url). */
export function normalizeDbRestaurantRow(
  row: DbRestaurant,
): DbRestaurant {
  const website = dbWebsite(row);
  return { ...row, website: website ?? row.website ?? null };
}
