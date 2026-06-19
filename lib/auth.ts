import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";

const ADMIN_ROLE = process.env.ADMIN_ROLE || "admin";

/** Récupère l'utilisateur Supabase courant côté serveur (ou null). */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Utilisateur courant via cookies OU en-tête Authorization (upload navigateur).
 */
export async function getCurrentUserFromRequest(
  req: Request,
): Promise<User | null> {
  const fromCookies = await getCurrentUser();
  if (fromCookies) return fromCookies;

  const header = req.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/** Vrai si le rôle administré en base est présent dans app_metadata.role. */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const appRole = (user.app_metadata as Record<string, unknown> | undefined)
    ?.role;
  return appRole === ADMIN_ROLE;
}

/**
 * Garde admin pour Route Handlers. Renvoie l'utilisateur si admin,
 * sinon un objet { error, status } à retourner tel quel.
 */
export async function requireAdmin(): Promise<
  { user: User } | { error: string; status: number }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "Non authentifié", status: 401 };
  if (!isAdmin(user)) return { error: "Accès réservé aux administrateurs", status: 403 };
  return { user };
}
