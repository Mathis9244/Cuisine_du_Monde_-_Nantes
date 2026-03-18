import Link from 'next/link';
import { Suspense } from 'react';
import { fetchApi, RestaurantsResponse } from '@/lib/api';
import { CatalogueFilters } from './CatalogueFilters';

interface PageProps {
  searchParams: Promise<{ cuisine?: string; search?: string; page?: string }>;
}

export default async function CataloguePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cuisine = params.cuisine || '';
  const search = params.search || '';
  const page = params.page || '1';

  const query = new URLSearchParams();
  if (cuisine) query.set('cuisine', cuisine);
  if (search) query.set('search', search);
  query.set('page', page);
  query.set('limit', '12');

  let data: RestaurantsResponse | null = null;
  let cuisines: string[] = [];
  try {
    [data, cuisines] = await Promise.all([
      fetchApi<RestaurantsResponse>(`/api/v1/restaurants?${query}`),
      fetchApi<string[]>('/api/v1/restaurants/cuisines'),
    ]);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-stone-800">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-stone-600 hover:text-orange-700">Accueil</Link>
            <Link href="/catalogue" className="font-medium text-orange-700">Catalogue</Link>
            <Link href="/admin" className="text-stone-600 hover:text-orange-700">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Catalogue des restaurants</h1>

        <Suspense fallback={<div className="h-12 bg-stone-100 rounded animate-pulse" />}>
          <CatalogueFilters cuisines={cuisines} initialCuisine={cuisine} initialSearch={search} />
        </Suspense>

        {data ? (
          <>
            <p className="text-stone-600 mb-4">
              {data.meta.total} restaurant{data.meta.total > 1 ? 's' : ''} trouvé{data.meta.total > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((r) => (
                <Link key={r.id} href={`/restaurant/${r.id}`} className="card block hover:shadow-lg transition-shadow">
                  <div className="p-5">
                    <h2 className="font-semibold text-lg mb-1">{r.name}</h2>
                    {r.cuisine && (
                      <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-sm mb-2">
                        {r.cuisine}
                      </span>
                    )}
                    {r.address && <p className="text-sm text-stone-600 truncate">{r.address}</p>}
                  </div>
                </Link>
              ))}
            </div>

            {data.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {parseInt(page) > 1 && (
                  <Link
                    href={`/catalogue?${new URLSearchParams({ ...params, page: String(parseInt(page) - 1) })}`}
                    className="btn"
                  >
                    Précédent
                  </Link>
                )}
                <span className="py-2 px-4">
                  Page {page} / {data.meta.totalPages}
                </span>
                {parseInt(page) < data.meta.totalPages && (
                  <Link
                    href={`/catalogue?${new URLSearchParams({ ...params, page: String(parseInt(page) + 1) })}`}
                    className="btn"
                  >
                    Suivant
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-stone-600">Aucun restaurant disponible. Vérifiez que l&apos;API est démarrée.</p>
        )}
      </main>
    </div>
  );
}
