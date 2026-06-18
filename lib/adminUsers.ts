import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLE = process.env.ADMIN_ROLE || "admin";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const target = normalizeEmail(email);
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const found = data.users.find(
      (u) => u.email && normalizeEmail(u.email) === target,
    );
    if (found) return found;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

export async function promoteUserToAdminByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    throw new Error("Email invalide");
  }

  const user = await findUserByEmail(normalized);
  if (!user) {
    throw new Error("Aucun compte trouvé pour cet email");
  }

  const appMetadata = {
    ...(user.app_metadata ?? {}),
    role: ADMIN_ROLE,
  };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: appMetadata,
  });

  if (error) throw new Error(error.message);

  return {
    id: data.user.id,
    email: data.user.email ?? normalized,
    role: ADMIN_ROLE,
  };
}
