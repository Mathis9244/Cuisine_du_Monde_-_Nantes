import { useState, useEffect } from "react";
import { fetchCuisines, fetchStats, fetchRestaurants } from "@/lib/api";
import { cuisineToCountry } from "@/lib/mappers";
import type { Restaurant, RestaurantStats } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function useFeaturedRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetchRestaurants({ limit: 60, sortBy: "rating", sortOrder: "desc" })
      .then((res) => {
        if (active) setRestaurants(res.data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { restaurants, loading, error };
}

export function useSpotlightRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let active = true;
    setLoading(true);

    fetchRestaurants({ spotlight: true, limit: 12 })
      .then((res) => {
        if (active) setRestaurants(res.data);
      })
      .catch(() => {
        if (active) setRestaurants([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { restaurants, loading };
}

export function useWheelCountries() {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchCuisines()
      .then((slugs) => {
        if (!active) return;
        const uniqueCountries = Array.from(
          new Set(slugs.map((s) => cuisineToCountry(s))),
        ).sort();
        setCountries(uniqueCountries);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
          setCountries([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { countries, loading, error };
}

export function useRestaurantStats() {
  const [stats, setStats] = useState<RestaurantStats | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;

    fetchStats()
      .then((stats) => {
        if (active) setStats(stats);
      })
      .catch(() => {
        if (active) setStats(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return stats;
}
