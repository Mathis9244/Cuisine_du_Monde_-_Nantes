const API_BASE =
  typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function parseErrorMessage(res: Response): Promise<string> {
  const fallback = `API error: ${res.status}`;
  try {
    const data = await res.json();
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export interface Restaurant {
  id: number;
  name: string;
  rating?: number | null;
  cuisine?: string | null;
  address?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  phone?: string | null;
}

export interface RestaurantsResponse {
  data: Restaurant[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StatsResponse {
  total: number;
  byCuisine: { cuisine: string | null; count: number }[];
}
