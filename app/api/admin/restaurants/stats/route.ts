import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createSupabaseAdminClient();

  const [totalRes, activeRes] = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  if (totalRes.error) {
    return NextResponse.json({ error: totalRes.error.message }, { status: 500 });
  }
  if (activeRes.error) {
    return NextResponse.json({ error: activeRes.error.message }, { status: 500 });
  }

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;

  return NextResponse.json({
    total,
    active,
    inactive: total - active,
  });
}
