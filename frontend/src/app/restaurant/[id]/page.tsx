import Link from 'next/link';
import { fetchApi, Restaurant } from '@/lib/api';
import { notFound } from 'next/navigation';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let restaurant: Restaurant | null = null;
  try {
    restaurant = await fetchApi<Restaurant>(`/api/v1/restaurants/${id}`);
  } catch {
    notFound();
  }

  if (!restaurant) notFound();

  const mapsUrl =
    restaurant.latitude && restaurant.longitude
      ? `https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`
      : restaurant.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + ', Nantes')}`
        : null;

  return (
    <div className="min-h-screen">
      <header className="app-header py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="brand-title text-xl font-bold">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/" className="nav-link">Accueil</Link>
            <Link href="/catalogue" className="nav-link">Catalogue</Link>
            <Link href="/admin" className="nav-link">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Link href="/catalogue" className="text-[var(--color-primary)] hover:underline mb-4 inline-block">
          ← Retour au catalogue
        </Link>

        <div className="card max-w-2xl overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
            {typeof restaurant.rating === 'number' && (
              <p className="text-sm text-[var(--color-primary)] mb-2">
                Note: {restaurant.rating.toFixed(1)} / 5
              </p>
            )}
            {restaurant.cuisine && (
              <span className="inline-block px-3 py-1 bg-[var(--color-surface-soft)] text-white rounded-full text-sm mb-4">
                {restaurant.cuisine}
              </span>
            )}

            <dl className="space-y-3">
              {restaurant.address && (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Adresse</dt>
                  <dd>{restaurant.address}</dd>
                </>
              )}
              <dt className="font-medium text-[var(--color-muted)]">Ville</dt>
              <dd>{restaurant.city}</dd>
              {restaurant.phone && (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Téléphone</dt>
                  <dd>
                    <a href={`tel:${restaurant.phone}`} className="text-[var(--color-primary)]">
                      {restaurant.phone}
                    </a>
                  </dd>
                </>
              )}
              {restaurant.website && (
                <>
                  <dt className="font-medium text-[var(--color-muted)]">Site web</dt>
                  <dd>
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)]">
                      {restaurant.website}
                    </a>
                  </dd>
                </>
              )}
            </dl>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-6 inline-block"
              >
                Voir sur Google Maps
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
