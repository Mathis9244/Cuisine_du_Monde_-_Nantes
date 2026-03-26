import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getValidatedEnv } from '../../config/env.schema';
import type { AuthenticatedUser } from '../../types/auth';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (jwks) return jwks;
  const env = getValidatedEnv();
  const url = new URL('/auth/v1/certs', env.SUPABASE_URL);
  jwks = createRemoteJWKSet(url);
  return jwks;
}

function coerceRole(claims: Record<string, unknown>): string | undefined {
  const role = claims['role'];
  if (typeof role === 'string' && role) return role;
  const appMetadata = claims['app_metadata'];
  if (appMetadata && typeof appMetadata === 'object') {
    const r = (appMetadata as Record<string, unknown>)['role'];
    if (typeof r === 'string' && r) return r;
  }
  return undefined;
}

export async function verifySupabaseJwt(token: string): Promise<AuthenticatedUser> {
  const { payload } = await jwtVerify(token, getJwks(), {
    typ: 'JWT',
  });

  const sub = payload.sub;
  if (!sub) throw new Error('Token missing sub');

  const email =
    typeof payload.email === 'string'
      ? payload.email
      : typeof payload['user_email'] === 'string'
        ? (payload['user_email'] as string)
        : undefined;

  const claims = payload as unknown as Record<string, unknown>;

  return {
    id: String(sub),
    email,
    role: coerceRole(claims),
    claims,
  };
}

