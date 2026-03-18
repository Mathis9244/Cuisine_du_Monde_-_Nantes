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
      className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const search = (form.querySelector('[name=search]') as HTMLInputElement)?.value || '';
        updateFilters({ search });
      }}
    >
      <input
        type="text"
        name="search"
        placeholder="Rechercher par nom..."
        defaultValue={initialSearch}
        className="px-3 py-2 border border-stone-300 rounded-md flex-1 min-w-[200px]"
      />
      <select
        value={initialCuisine}
        onChange={(e) => updateFilters({ cuisine: e.target.value })}
        className="px-3 py-2 border border-stone-300 rounded-md"
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
