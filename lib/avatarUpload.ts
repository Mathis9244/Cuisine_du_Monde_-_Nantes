import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/avatarUpload.shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function resolveContentType(file: File): string | null {
  const raw = file.type?.toLowerCase().trim();
  if (raw === "image/jpg" || raw === "image/pjpeg") return "image/jpeg";
  if (raw && AVATAR_ALLOWED_TYPES.has(raw)) return raw;

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  return null;
}

/**
 * Envoie la photo via l'API serveur (contourne les policies Storage côté client).
 */
export async function uploadAvatar(_userId: string, file: File): Promise<string> {
  const contentType = resolveContentType(file);
  if (!contentType) {
    throw new Error(
      `Format non supporté (${file.type || file.name}). Utilise JPG, PNG ou GIF.`,
    );
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error(
      `Image trop lourde (${Math.round(file.size / 1024 / 1024)} Mo, max ${Math.round(AVATAR_MAX_BYTES / 1024 / 1024)} Mo)`,
    );
  }

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Non connecté — reconnecte-toi puis réessaie");
  }

  const formData = new FormData();
  formData.append("file", file, file.name || "avatar.jpg");

  const res = await fetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const body = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(body.error || "Impossible d'envoyer la photo");
  }

  if (!body.url) {
    throw new Error("Réponse serveur invalide");
  }

  return body.url;
}

export { AVATAR_BUCKET } from "@/lib/avatarUpload.shared";
