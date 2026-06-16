import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("cuisine")
    .eq("is_active", true)
    .not("cuisine", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cuisines = Array.from(
    new Set(
      (data as { cuisine: string | null }[])
        .map((r) => r.cuisine)
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json(cuisines);
}
