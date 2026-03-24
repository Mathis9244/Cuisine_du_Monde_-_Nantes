import Link from 'next/link';
import { fetchApi, Restaurant, RestaurantsResponse, StatsResponse } from '@/lib/api';

export default async function HomePage() {
  let stats: StatsResponse | null = null;
  let topByCuisine: Array<{ cuisine: string; restaurants: Restaurant[] }> = [];

  try {
    stats = await fetchApi<StatsResponse>('/api/v1/restaurants/stats');
    const topCuisines = (stats.byCuisine || [])
      .map((item) => item.cuisine)
      .filter((cuisine): cuisine is string => Boolean(cuisine))
      .slice(0, 6);

    const cuisineResults = await Promise.all(
      topCuisines.map(async (cuisine) => {
        const query = new URLSearchParams({
          cuisine,
          limit: '24',
          sortBy: 'rating',
          sortOrder: 'desc',
        });

        const response = await fetchApi<RestaurantsResponse>(`/api/v1/restaurants?${query.toString()}`);
        const restaurants = [...response.data]
          .filter((restaurant) => typeof restaurant.rating === 'number')
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);

        return { cuisine, restaurants };
      })
    );

    topByCuisine = cuisineResults.filter((item) => item.restaurants.length > 0);
  } catch {
    // API non disponible
  }

  return (
    <div className="min-h-screen">
      <header className="app-header py-4">
        <div className="container flex justify-between items-center">
          <h1 className="brand-title text-xl font-bold">🍽️ Cuisine du Monde - Nantes</h1>
          <nav className="flex gap-4">
            <Link href="/" className="nav-link-active">Accueil</Link>
            <Link href="/catalogue" className="nav-link">Catalogue</Link>
            <Link href="/admin" className="nav-link">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-12">
        <section className="hero-neon text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Découvrez les saveurs du monde à Nantes
          </h2>
          <p className="text-lg text-[var(--color-muted)] mb-8 max-w-2xl mx-auto">
            Une interface claire pour trouver rapidement un restaurant par nom, quartier ou type de cuisine.
          </p>

          <form action="/catalogue" method="get" className="card p-4 md:p-5 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="search"
                name="search"
                placeholder="Rechercher un restaurant, une cuisine, une adresse..."
                className="input-base px-4 py-3 flex-1"
                aria-label="Rechercher un restaurant"
              />
              <button type="submit" className="btn px-6 py-3">
                Rechercher
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="card px-4 py-2 text-sm text-[var(--color-muted)]">
              {stats?.total ?? 0} restaurants
            </span>
            <span className="card px-4 py-2 text-sm text-[var(--color-muted)]">
              {stats?.byCuisine?.length ?? 0} cuisines
            </span>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <h3 className="text-2xl font-semibold text-white">Top restaurants les mieux notes</h3>
            <Link href="/catalogue" className="nav-link text-sm">
              Voir tout le catalogue
            </Link>
          </div>

          {topByCuisine.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {topByCuisine.map((group) => (
                <article key={group.cuisine} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">{group.cuisine}</h4>
                    <Link
                      href={`/catalogue?cuisine=${encodeURIComponent(group.cuisine)}`}
                      className="text-sm text-[var(--color-primary)] hover:underline"
                    >
                      Voir plus
                    </Link>
                  </div>
                  <ul className="space-y-2">
                    {group.restaurants.map((restaurant, index) => (
                      <li key={restaurant.id}>
                        <Link
                          href={`/restaurant/${restaurant.id}`}
                          className="flex items-center justify-between p-3 rounded-md bg-[var(--color-surface-soft)]/40 hover:bg-[var(--color-surface-soft)]/70 transition-colors"
                        >
                          <span className="text-white">
                            {index + 1}. {restaurant.name}
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">
                            Note: {(restaurant.rating || 0).toFixed(1)} / 5
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-muted)]">
              Aucune note disponible pour le moment. Ajoute des notes cote admin pour activer ce classement.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
