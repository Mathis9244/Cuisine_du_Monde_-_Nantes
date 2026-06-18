import { describe, expect, it } from "vitest";
import type { Restaurant } from "@/lib/types";
import {
  isActiveSpotlight,
  isLessKnownRestaurant,
  isRestaurantBoosted,
  spotlightScoreBonus,
} from "@/lib/visibility";

const lessKnown: Restaurant = {
  id: "1",
  name: "Petit resto",
  country: "Ethiopia",
  address: "Nantes",
  imageUrl: "",
  specialty: "Ethiopian",
  description: "Test",
  rating: 3.8,
  boostUntil: new Date(Date.now() + 86400000).toISOString(),
  boostTier: 2,
};

describe("visibility", () => {
  it("detects less known restaurants", () => {
    expect(isLessKnownRestaurant(lessKnown)).toBe(true);
    expect(
      isLessKnownRestaurant({ ...lessKnown, rating: 4.8, friendRatings: [] }),
    ).toBe(false);
  });

  it("activates spotlight only for boosted less-known venues", () => {
    expect(isRestaurantBoosted(lessKnown)).toBe(true);
    expect(isActiveSpotlight(lessKnown)).toBe(true);
    expect(
      isActiveSpotlight({ ...lessKnown, boostUntil: null }),
    ).toBe(false);
  });

  it("adds tier-based score bonus", () => {
    expect(spotlightScoreBonus(lessKnown)).toBeGreaterThan(1);
    expect(spotlightScoreBonus({ ...lessKnown, boostUntil: null })).toBe(0);
  });
});
