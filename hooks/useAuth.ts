import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function avatarFor(username: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

function resolveAvatar(
  username: string,
  metadata?: Record<string, unknown>,
): string {
  const custom = metadata?.avatar_url;
  if (typeof custom === "string" && custom.trim()) return custom.trim();
  return avatarFor(username);
}

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  bio: string;
  avatarUrl: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const toSessionUser = async (
      sessionUser:
        | {
            id: string;
            email?: string;
            user_metadata?: Record<string, unknown>;
          }
        | null
        | undefined,
    ): Promise<SessionUser | null> => {
      if (!sessionUser) return null;
      const username =
        (sessionUser.user_metadata?.username as string | undefined) ||
        sessionUser.email?.split("@")[0] ||
        "user";
      let isAdmin = false;
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const me = (await res.json()) as { isAdmin?: boolean };
          isAdmin = Boolean(me.isAdmin);
        }
      } catch {
        // ignore
      }
      const bio = (sessionUser.user_metadata?.bio as string | undefined) || "";
      const avatarUrl = resolveAvatar(
        username,
        sessionUser.user_metadata as Record<string, unknown>,
      );
      return {
        id: sessionUser.id,
        email: sessionUser.email || "",
        username,
        bio,
        avatarUrl,
        isAdmin,
      };
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = await toSessionUser(data.session?.user);
      setUser(sessionUser);
      setLoading(false);
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = await toSessionUser(session?.user);
        setUser(sessionUser);
      },
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = () => {
    const supabase = getSupabaseBrowserClient();
    setUser(null);
    void supabase.auth.signOut();
  };

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  return { user, loading, logout, updateUser };
}
