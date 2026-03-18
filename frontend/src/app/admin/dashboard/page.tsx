'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ total: number; byCuisine: { cuisine: string | null; count: number }[] } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetch('/api/v1/restaurants/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, [router]);

  const handleSync = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/v1/sync/osm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSyncResult(data.message || `${data.saved} restaurants synchronisés`);
      if (data.total !== undefined) setStats((s) => (s ? { ...s, total: data.total } : null));
      else fetch('/api/v1/restaurants/stats', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(setStats);
    } catch (e) {
      setSyncResult('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCsv = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/admin/restaurants/export/csv?excludeFrench=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'restaurants_nantes.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSyncResult('Erreur lors de l\'export CSV');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-stone-800">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/admin" className="text-stone-600 hover:text-orange-700">Admin</Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/admin');
              }}
              className="text-stone-600 hover:text-orange-700"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card p-6">
              <div className="text-3xl font-bold text-orange-600">{stats.total}</div>
              <div className="text-stone-600">Restaurants</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-orange-600">{stats.byCuisine?.length || 0}</div>
              <div className="text-stone-600">Types de cuisines</div>
            </div>
          </div>
        )}

        <div className="card p-6 max-w-xl space-y-4">
          <h2 className="font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleSync} className="btn" disabled={syncing}>
              {syncing ? 'Synchronisation...' : 'Synchroniser depuis OpenStreetMap'}
            </button>
            <button onClick={handleExportCsv} className="btn">
              Export CSV
            </button>
          </div>
          {syncResult && <p className="text-sm text-stone-600">{syncResult}</p>}
        </div>

        <p className="mt-6 text-sm text-stone-500">
          L&apos;export CSV nécessite d&apos;être authentifié. Pour un export direct, utilisez l&apos;API avec votre token.
        </p>
      </main>
    </div>
  );
}
