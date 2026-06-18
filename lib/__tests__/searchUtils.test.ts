import { describe, expect, it } from "vitest";
import type { Restaurant } from "@/lib/types";
import { restaurantMatchesSearch } from "@/lib/searchUtils";

const base: Restaurant = {
  id: "1",
  name: "Le Petit Thaï",
  country: "Thailand",
  address: "12 rue Kervégan, Nantes",
  imageUrl: "",
  specialty: "Pad thaï",
  description: "Cuisine thaïlandaise authentique",
  rating: 4.5,
  website: "https://petit-thai.fr",
  phone: "02 40 00 00 00",
};

describe("restaurantMatchesSearch", () => {
  it("matches all query tokens across fields", () => {
    expect(restaurantMatchesSearch(base, "pad thai")).toBe(true);
    expect(restaurantMatchesSearch(base, "nantes thaï")).toBe(true);
    expect(restaurantMatchesSearch(base, "petit pad")).toBe(true);
  });

  it("rejects when a token is missing", () => {
    expect(restaurantMatchesSearch(base, "pad sushi")).toBe(false);
  });

  it("is accent-insensitive", () => {
    expect(restaurantMatchesSearch(base, "thai")).toBe(true);
  });

  it("matches phone and website", () => {
    expect(restaurantMatchesSearch(base, "0240")).toBe(true);
    expect(restaurantMatchesSearch(base, "petit-thai")).toBe(true);
  });
});
