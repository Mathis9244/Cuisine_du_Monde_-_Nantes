import { useState, useCallback, useRef, useEffect } from "react";
import { Restaurant } from "@/lib/types";
import { fetchRestaurants } from "@/lib/api";
import { countryToCuisine } from "@/lib/mappers";

interface UseRestaurantStateOptions {
  viewAllCountry: string | null;
  feedSearchQuery: string;
}

export function useRestaurantState(opts: UseRestaurantStateOptions) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (pageNum?: number, append?: boolean) => {
      const reqId = ++requestIdRef.current;
      const effectivePage = pageNum ?? 1;
      const isAppend = Boolean(append);

      if (isAppend) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const cuisineFilter = opts.viewAllCountry
          ? countryToCuisine(opts.viewAllCountry)
          : undefined;

        const res = await fetchRestaurants({
          page: effectivePage,
          limit: 20,
          search: opts.feedSearchQuery || undefined,
          cuisine: cuisineFilter,
          sortBy: "name",
          sortOrder: "asc",
        });

        if (reqId !== requestIdRef.current) return;

        setTotalPages(res.meta.totalPages);
        setRestaurants((prev) =>
          isAppend ? [...prev, ...res.data] : res.data,
        );
      } catch (err) {
        if (reqId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (reqId === requestIdRef.current) {
          if (isAppend) setLoadingMore(false);
          else setLoading(false);
        }
      }
    },
    [opts.viewAllCountry, opts.feedSearchQuery],
  );

  return {
    restaurants,
    loading,
    loadingMore,
    error,
    page,
    totalPages,
    setPage,
    load,
  };
}
