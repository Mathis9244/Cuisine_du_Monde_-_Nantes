import type { DbRestaurant, Restaurant } from "./types";
import { isActiveSpotlight } from "./visibility";

/** Slug de cuisine (anglais, comme stocké en base) -> pays affiché dans l'UI. */
const CUISINE_TO_COUNTRY: Record<string, string> = {
  chinese: "China",
  japanese: "Japan",
  indian: "India",
  thai: "Thailand",
  vietnamese: "Vietnam",
  korean: "Korea",
  lebanese: "Lebanon",
  turkish: "Turkey",
  italian: "Italy",
  french: "France",
  spanish: "Spain",
  greek: "Greece",
  mexican: "Mexico",
  american: "USA",
  moroccan: "Morocco",
  mediterranean: "Mediterranean",
  asian: "Asia",
  seafood: "Seafood",
  ethiopian: "Ethiopia",
};

/** Image d'illustration par cuisine (Unsplash). */
const CUISINE_TO_IMAGE: Record<string, string> = {
  japanese:
    "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=1000",
  chinese:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=1000",
  italian:
    "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=1000",
  mexican:
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=1000",
  lebanese:
    "https://images.unsplash.com/photo-1544124499-58912cbddade?auto=format&fit=crop&q=80&w=1000",
  vietnamese:
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=1000",
  ethiopian:
    "https://images.unsplash.com/photo-1541518763669-279f00ed02ae?auto=format&fit=crop&q=80&w=1000",
  indian:
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=1000",
  thai: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=1000",
  korean:
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=1000",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000";

export function cuisineToCountry(cuisine: string | null | undefined): string {
  if (!cuisine) return "World";
  const key = cuisine.toLowerCase().trim();
  return CUISINE_TO_COUNTRY[key] ?? capitalize(cuisine);
}

/** Libellé pays (UI) → slug cuisine pour filtrer l'API. */
export function countryToCuisine(country: string): string {
  const normalized = country.trim().toLowerCase();
  for (const [cuisine, label] of Object.entries(CUISINE_TO_COUNTRY)) {
    if (label.toLowerCase() === normalized) return cuisine;
  }
  return country.toLowerCase();
}

function cuisineToImage(cuisine: string | null | undefined): string {
  if (!cuisine) return FALLBACK_IMAGE;
  return CUISINE_TO_IMAGE[cuisine.toLowerCase().trim()] ?? FALLBACK_IMAGE;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Convertit une ligne de la base vers le modèle UI. */
export function toRestaurant(db: DbRestaurant): Restaurant {
  const country = cuisineToCountry(db.cuisine);
  const cuisineLabel = db.cuisine ? capitalize(db.cuisine) : country;
  const cityPart = db.city ? ` à ${db.city}` : "";

  return {
    id: String(db.id),
    name: db.name,
    country,
    address: db.address ?? "",
    imageUrl: cuisineToImage(db.cuisine),
    specialty: cuisineLabel,
    description:
      `${db.name} — cuisine ${cuisineLabel.toLowerCase()}${cityPart}.`.trim(),
    rating: db.rating ?? undefined,
    website: db.website ?? db.url ?? null,
    phone: db.phone,
    latitude: db.latitude,
    longitude: db.longitude,
    boostUntil: db.boost_until ?? null,
    boostTier: db.boost_tier ?? 1,
  };
}

/** Recalcule le flag spotlight (après notes cercle). */
export function applySpotlightFlag(restaurant: Restaurant): Restaurant {
  return {
    ...restaurant,
    isSpotlight: isActiveSpotlight(restaurant),
  };
}
