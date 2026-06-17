/** Bucket Supabase Storage pour les images de profil. */
export const AVATAR_BUCKET = "Images";

export const AVATAR_MAX_BYTES = 20 * 1024 * 1024;

/** Aligné sur les MIME autorisés du bucket Images (dashboard Supabase). */
export const AVATAR_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
]);
