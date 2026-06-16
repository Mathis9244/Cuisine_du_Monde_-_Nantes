import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./supabase/server";

const ADMIN_ROLE = process.env.ADMIN_ROLE || "admin";

/** Récupère l'utilisateur Supabase courant côté serveur (ou null). */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Vrai si l'utilisateur a le rôle admin (app_metadata.role ou user_metadata.role). */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const appRole = (user.app_metadata as Record<string, unknown> | undefined)
    ?.role;
  const userRole = (user.user_metadata as Record<string, unknown> | undefined)
    ?.role;
  return appRole === ADMIN_ROLE || userRole === ADMIN_ROLE;
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
