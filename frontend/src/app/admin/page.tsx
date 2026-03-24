import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <header className="app-header py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="brand-title text-xl font-bold">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/" className="nav-link">Accueil</Link>
            <Link href="/catalogue" className="nav-link">Catalogue</Link>
            <Link href="/admin" className="nav-link-active">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Back-office</h1>

        <div className="card p-6 max-w-md">
          <h2 className="font-semibold mb-4">Connexion administrateur</h2>
          <p className="text-[var(--color-muted)] mb-4">
            Connectez-vous pour accéder au tableau de bord, à la synchronisation OSM et à l&apos;export CSV.
          </p>
          <Link href="/admin/login" className="btn">
            Se connecter
          </Link>
        </div>

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Compte de démo : admin@cuisine-du-monde.local / admin123 (après seed)
        </p>
      </main>
    </div>
  );
}
