'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

type Stats = { total: number; byCuisine: { cuisine: string | null; count: number }[] };
type SyncResponse = { message?: string; saved?: number; fetched?: number; total?: number };
type SyncSummary = {
  source: 'osm' | 'google';
  cuisine?: string;
  fetched: number;
  saved: number;
  message: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLabel, setSyncLabel] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetchApi<Stats>('/api/v1/restaurants/stats');
        setStats(response);
        setStatsError(null);
      } catch {
        setStats(null);
        setStatsError('Impossible de charger les statistiques');
      }
    };

    void loadStats();
  }, [router]);

  const handleSync = async (cuisineFilter?: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setSyncing(true);
    setSyncLabel('Synchronisation OpenStreetMap');
    setSyncResult(null);
    setSyncSummary(null);
    try {
      const data = await fetchApi<SyncResponse>('/api/v1/sync/osm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cuisine: cuisineFilter || undefined }),
      });
      const message = data.message || `${data.saved || 0} restaurants synchronisés`;
      setSyncResult(message);
      setSyncSummary({
        source: 'osm',
        cuisine: cuisineFilter,
        fetched: data.fetched || 0,
        saved: data.saved || 0,
        message,
      });
      const total = data.total;
      if (total !== undefined) setStats((s) => (s ? { ...s, total } : null));
      else {
        const response = await fetchApi<Stats>('/api/v1/restaurants/stats');
        setStats(response);
      }
    } catch {
      setSyncResult('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
      setSyncLabel(null);
    }
  };

  const handleGoogleSync = async (cuisineFilter?: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setSyncing(true);
    setSyncLabel('Synchronisation Google Maps');
    setSyncResult(null);
    setSyncSummary(null);
    try {
      const data = await fetchApi<SyncResponse>('/api/v1/sync/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cuisine: cuisineFilter || undefined }),
      });
      const message = data.message || `${data.saved || 0} restaurants synchronisés`;
      setSyncResult(message);
      setSyncSummary({
        source: 'google',
        cuisine: cuisineFilter,
        fetched: data.fetched || 0,
        saved: data.saved || 0,
        message,
      });
      const response = await fetchApi<Stats>('/api/v1/restaurants/stats');
      setStats(response);
    } catch (error) {
      setSyncResult(
        error instanceof Error
          ? `Erreur sync Google: ${error.message}`
          : 'Erreur lors de la synchronisation Google',
      );
    } finally {
      setSyncing(false);
      setSyncLabel(null);
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
      <header className="app-header py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="brand-title text-xl font-bold">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/admin" className="nav-link-active">Admin</Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/admin');
              }}
              className="nav-link"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">
          Tableau de bord <span className="text-[var(--color-primary)]">Néon</span>
        </h1>
        {statsError && <p className="mb-4 text-sm text-red-700">{statsError}</p>}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="card p-6">
              <div className="text-3xl font-bold text-[var(--color-primary)]">{stats.total}</div>
              <div className="text-[var(--color-muted)]">Restaurants</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-bold text-[var(--color-primary)]">{stats.byCuisine?.length || 0}</div>
              <div className="text-[var(--color-muted)]">Types de cuisines</div>
            </div>
          </div>
        )}

        {stats && (
          <div className="mb-6 card p-4">
            <h2 className="text-sm font-medium text-[var(--color-muted)] mb-2">Scrapping Nantes par type de cuisine</h2>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="input-base px-3 py-2"
                aria-label="Type de cuisine"
              >
                <option value="">Toutes cuisines</option>
                {stats.byCuisine
                  .map((c) => c.cuisine)
                  .filter((c): c is string => !!c)
                  .sort((a, b) => a.localeCompare(b))
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => handleSync(selectedCuisine || undefined)}
                className="btn"
                disabled={syncing}
              >
                {syncing
                  ? 'Synchronisation...'
                  : selectedCuisine
                    ? `Synchroniser: ${selectedCuisine}`
                    : 'Synchroniser toutes cuisines'}
              </button>
              <button
                onClick={() => handleGoogleSync(selectedCuisine || undefined)}
                className="btn"
                disabled={syncing}
              >
                {syncing
                  ? 'Synchronisation...'
                  : selectedCuisine
                    ? `Google Maps: ${selectedCuisine}`
                    : 'Google Maps (Selenium)'}
              </button>
              <button
                onClick={() => {
                  setSelectedCuisine('');
                  handleSync(undefined);
                }}
                className="btn"
                disabled={syncing}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        <div className="card p-6 max-w-xl space-y-4">
          <h2 className="font-semibold">Actions</h2>
          {syncing && (
            <div className="rounded-md border border-[var(--color-primary)]/40 p-3 bg-[var(--color-surface-soft)]/30">
              <p className="text-sm text-white font-medium">
                {syncLabel || 'Synchronisation en cours...'}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Le scraping peut prendre quelques instants selon le nombre de résultats.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <button onClick={() => handleSync(undefined)} className="btn" disabled={syncing}>
              {syncing ? 'Synchronisation...' : 'Synchroniser depuis OpenStreetMap'}
            </button>
            <button onClick={() => handleGoogleSync(undefined)} className="btn" disabled={syncing}>
              {syncing ? 'Synchronisation...' : 'Synchroniser depuis Google Maps (Selenium)'}
            </button>
            <button onClick={handleExportCsv} className="btn">
              Export CSV
            </button>
          </div>
          {syncResult && <p className="text-sm text-[var(--color-muted)]" aria-live="polite">{syncResult}</p>}
          {syncSummary && (
            <div className="rounded-md border border-[var(--color-primary)]/30 p-3 space-y-1">
              <p className="text-sm text-white">
                Source: {syncSummary.source === 'google' ? 'Google Maps (Selenium)' : 'OpenStreetMap'}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Cuisine: {syncSummary.cuisine || 'Toutes'}
              </p>
              <p className="text-sm text-[var(--color-muted)]">
                Récupérés: {syncSummary.fetched} · Enregistrés: {syncSummary.saved}
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          L&apos;export CSV nécessite d&apos;être authentifié. Pour un export direct, utilisez l&apos;API avec votre token.
        </p>
      </main>
    </div>
  );
}
