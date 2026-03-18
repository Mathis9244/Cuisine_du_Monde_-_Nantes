import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-stone-800">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-stone-600 hover:text-orange-700">Accueil</Link>
            <Link href="/catalogue" className="text-stone-600 hover:text-orange-700">Catalogue</Link>
            <Link href="/admin" className="font-medium text-orange-700">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Back-office</h1>

        <div className="card p-6 max-w-md">
          <h2 className="font-semibold mb-4">Connexion administrateur</h2>
          <p className="text-stone-600 mb-4">
            Connectez-vous pour accéder au tableau de bord, à la synchronisation OSM et à l&apos;export CSV.
          </p>
          <Link href="/admin/login" className="btn">
            Se connecter
          </Link>
        </div>

        <p className="mt-6 text-sm text-stone-500">
          Compte de démo : admin@cuisine-du-monde.local / admin123 (après seed)
        </p>
      </main>
    </div>
  );
}
