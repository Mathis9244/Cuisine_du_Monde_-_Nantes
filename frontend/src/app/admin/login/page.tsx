'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, fetchApi } from '@/lib/api';

interface LoginResponse {
  access_token: string;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe sont requis');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await fetchApi<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      localStorage.setItem('token', data.access_token);
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Identifiants invalides');
      } else {
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="app-header py-4">
        <div className="container flex justify-between items-center">
          <Link href="/" className="brand-title text-xl font-bold">🍽️ Cuisine du Monde - Nantes</Link>
          <nav className="flex gap-4">
            <Link href="/admin" className="nav-link">← Retour admin</Link>
          </nav>
        </div>
      </header>

      <main className="container py-16 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4" noValidate>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm" role="alert" aria-live="polite">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block font-medium text-[var(--color-muted)] mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-base w-full px-3 py-2"
              placeholder="admin@cuisine-du-monde.local"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-medium text-[var(--color-muted)] mb-1">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-base w-full px-3 py-2"
            />
          </div>
          <button type="submit" className="btn w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </main>
    </div>
  );
}
