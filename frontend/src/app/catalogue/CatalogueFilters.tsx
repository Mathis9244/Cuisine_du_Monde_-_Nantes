'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  cuisines: string[];
  initialCuisine: string;
  initialSearch: string;
}

export function CatalogueFilters({ cuisines, initialCuisine, initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      params.delete('page');
      router.push(`/catalogue?${params}`);
    },
    [router, searchParams]
  );

  return (
    <form
      className="flex flex-wrap gap-4 mb-6 p-4 card"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchValue = formData.get('search');
        updateFilters({ search: typeof searchValue === 'string' ? searchValue.trim() : '' });
      }}
    >
      <label htmlFor="catalogue-search" className="sr-only">Rechercher un restaurant</label>
      <input
        id="catalogue-search"
        type="text"
        name="search"
        placeholder="Rechercher par nom..."
        defaultValue={initialSearch}
        className="input-base px-3 py-2 flex-1 min-w-[200px]"
      />
      <label htmlFor="catalogue-cuisine" className="sr-only">Filtrer par cuisine</label>
      <select
        id="catalogue-cuisine"
        value={initialCuisine}
        onChange={(e) => updateFilters({ cuisine: e.target.value })}
        className="input-base px-3 py-2"
      >
        <option value="">Toutes les cuisines</option>
        {cuisines.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button type="submit" className="btn">
        Filtrer
      </button>
    </form>
  );
}
