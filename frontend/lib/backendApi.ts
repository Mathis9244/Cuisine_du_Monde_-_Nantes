import { supabase } from './supabase';

const backendBaseUrl =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  'http://localhost:3001';

export async function fetchBackend<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Backend error: ${res.status}`);
  }
  return (await res.json()) as T;
}

