import Link from 'next/link';
import { fetchApi, StatsResponse } from '@/lib/api';

export default async function HomePage() {
  let stats: StatsResponse | null = null;
  try {
    stats = await fetchApi<StatsResponse>('/api/v1/restaurants/stats');
  } catch {
    // API non disponible
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-xl font-bold text-stone-800">🍽️ Cuisine du Monde - Nantes</h1>
          <nav className="flex gap-4">
            <Link href="/" className="font-medium text-orange-700">Accueil</Link>
            <Link href="/catalogue" className="text-stone-600 hover:text-orange-700">Catalogue</Link>
            <Link href="/admin" className="text-stone-600 hover:text-orange-700">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-16">
        <section className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-stone-900 mb-4">
            Découvrez les saveurs du monde à Nantes
          </h2>
          <p className="text-lg text-stone-600 mb-8">
            Explorez notre sélection de restaurants proposant des cuisines du monde entier.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {stats && (
              <div className="card p-6 min-w-[180px]">
                <div className="text-3xl font-bold text-orange-600">{stats.total}</div>
                <div className="text-stone-600">Restaurants</div>
              </div>
            )}
            {stats?.byCuisine && stats.byCuisine.length > 0 && (
              <div className="card p-6 min-w-[180px]">
                <div className="text-3xl font-bold text-orange-600">{stats.byCuisine.length}</div>
                <div className="text-stone-600">Types de cuisines</div>
              </div>
            )}
          </div>
        </section>

        <section className="text-center">
          <Link href="/catalogue" className="btn text-lg px-8 py-4">
            Explorer le catalogue
          </Link>
        </section>
      </main>
    </div>
  );
}
