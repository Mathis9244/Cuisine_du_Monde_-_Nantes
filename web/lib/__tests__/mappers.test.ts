import { describe, it, expect } from "vitest";
import {
  cuisineToCountry,
  countryToCuisine,
  toRestaurant,
} from "@/lib/mappers";
import type { DbRestaurant } from "@/lib/types";

const baseRow: DbRestaurant = {
  id: 42,
  name: "Sushi Zen",
  rating: 4.5,
  cuisine: "japanese",
  address: "12 rue de la Fosse",
  city: "Nantes",
  latitude: 47.22,
  longitude: -1.55,
  website: null,
  phone: null,
  source: "osm",
  source_id: "123",
  is_active: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("cuisineToCountry", () => {
  it("mappe un slug connu vers le pays affiché", () => {
    expect(cuisineToCountry("japanese")).toBe("Japan");
    expect(cuisineToCountry("ITALIAN")).toBe("Italy");
  });

  it("retourne World si cuisine absente", () => {
    expect(cuisineToCountry(null)).toBe("World");
    expect(cuisineToCountry(undefined)).toBe("World");
  });

  it("capitalise une cuisine inconnue", () => {
    expect(cuisineToCountry("peruvian")).toBe("Peruvian");
  });
});

describe("countryToCuisine", () => {
  it("convertit un libellé pays vers le slug API", () => {
    expect(countryToCuisine("Japan")).toBe("japanese");
    expect(countryToCuisine("  Italy ")).toBe("italian");
  });

  it("retourne le slug en minuscules si pays inconnu", () => {
    expect(countryToCuisine("Peruvian")).toBe("peruvian");
  });
});

describe("toRestaurant", () => {
  it("convertit une ligne DB vers le modèle UI", () => {
    const r = toRestaurant(baseRow);
    expect(r.id).toBe("42");
    expect(r.name).toBe("Sushi Zen");
    expect(r.country).toBe("Japan");
    expect(r.specialty).toBe("Japanese");
    expect(r.address).toBe("12 rue de la Fosse");
    expect(r.rating).toBe(4.5);
    expect(r.latitude).toBe(47.22);
    expect(r.description).toContain("Sushi Zen");
    expect(r.description).toContain("Nantes");
    expect(r.imageUrl).toMatch(/^https:\/\//);
  });

  it("gère une cuisine manquante", () => {
    const r = toRestaurant({ ...baseRow, cuisine: null });
    expect(r.country).toBe("World");
  });
});
