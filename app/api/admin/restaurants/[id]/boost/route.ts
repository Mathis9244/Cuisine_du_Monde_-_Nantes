import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingBoostColumnError } from "@/lib/dbBoost";
import { boostExpiryFromDays } from "@/lib/visibility";

function boostMigrationHint() {
  return "Colonnes boost manquantes — lance la migration boost dans l'admin.";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const body = (await request.json()) as {
    active?: boolean;
    days?: number;
    tier?: number;
  };

  const supabase = createSupabaseAdminClient();

  if (body.active === false) {
    const { data, error } = await supabase
      .from("restaurants")
      .update({ boost_until: null, boost_tier: 1 })
      .eq("id", numericId)
      .select("*")
      .single();
    if (error) {
      const status = isMissingBoostColumnError(error.message) ? 503 : 500;
      return NextResponse.json(
        { error: isMissingBoostColumnError(error.message) ? boostMigrationHint() : error.message },
        { status },
      );
    }
    return NextResponse.json(data);
  }

  const days = Math.min(365, Math.max(1, body.days ?? 30));
  const tier = body.tier === 2 ? 2 : 1;

  const { data, error } = await supabase
    .from("restaurants")
    .update({
      boost_until: boostExpiryFromDays(days),
      boost_tier: tier,
    })
    .eq("id", numericId)
    .select("*")
    .single();

  if (error) {
    const status = isMissingBoostColumnError(error.message) ? 503 : 500;
    return NextResponse.json(
      { error: isMissingBoostColumnError(error.message) ? boostMigrationHint() : error.message },
      { status },
    );
  }
  return NextResponse.json(data);
}
