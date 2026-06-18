import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { promoteUserToAdminByEmail } from "@/lib/adminUsers";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  try {
    const promoted = await promoteUserToAdminByEmail(email);
    return NextResponse.json({
      ok: true,
      user: promoted,
      message: `${promoted.email} est maintenant administrateur`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    const status = message.includes("trouvé") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
