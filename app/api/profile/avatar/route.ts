import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AVATAR_BUCKET } from "@/lib/avatarUpload.shared";
import { AVATAR_MAX_BYTES } from "@/lib/avatarUpload.shared";

const MAX_BYTES = AVATAR_MAX_BYTES;

interface UploadFile {
  blob: Blob;
  fileName: string;
  size: number;
  mime: string;
}

function readUploadFile(formData: FormData): UploadFile | null {
  const entry = formData.get("file");
  if (!entry || typeof entry === "string") return null;

  const blob = entry as Blob;
  const fileName =
    "name" in entry && typeof (entry as { name?: string }).name === "string"
      ? (entry as { name: string }).name
      : "avatar.jpg";

  return {
    blob,
    fileName,
    size: blob.size,
    mime: blob.type || "",
  };
}

function resolveContentType(fileName: string, mime: string): string | null {
  const raw = mime.toLowerCase().trim();
  if (raw === "image/jpg" || raw === "image/pjpeg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/gif"].includes(raw)) return raw;

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  return null;
}

function extensionFor(fileName: string, contentType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

export async function POST(req: Request) {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié — reconnecte-toi puis réessaie" },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const upload = readUploadFile(formData);
  if (!upload || upload.size === 0) {
    return NextResponse.json({ error: "Fichier manquant ou vide" }, { status: 400 });
  }

  const contentType = resolveContentType(upload.fileName, upload.mime);
  if (!contentType) {
    return NextResponse.json(
      {
        error: `Format non supporté (${upload.mime || "inconnu"}). Utilise JPG, PNG ou GIF.`,
      },
      { status: 400 },
    );
  }

  if (upload.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image trop lourde (${Math.round(upload.size / 1024 / 1024)} Mo, max ${Math.round(MAX_BYTES / 1024 / 1024)} Mo)` },
      { status: 400 },
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const ext = extensionFor(upload.fileName, contentType);
    const path = `avatars/${user.id}/avatar.${ext}`;
    const bytes = Buffer.from(await upload.blob.arrayBuffer());

    const { error } = await admin.storage.from(AVATAR_BUCKET).upload(path, bytes, {
      upsert: true,
      contentType,
      cacheControl: "3600",
    });

    if (error) {
      return NextResponse.json(
        { error: `Storage : ${error.message}` },
        { status: 500 },
      );
    }

    const { data } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;

    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message.includes("SUPABASE_SERVICE_ROLE_KEY")
          ? "Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY)"
          : err.message
        : "Erreur lors de l'envoi de la photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
