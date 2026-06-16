import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error, count } = await supabase
    .from("restaurants")
    .select("cuisine", { count: "exact" })
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const row of data as { cuisine: string | null }[]) {
    if (!row.cuisine) continue;
    counts.set(row.cuisine, (counts.get(row.cuisine) ?? 0) + 1);
  }

  const byCuisine = Array.from(counts.entries())
    .map(([cuisine, c]) => ({ cuisine, count: c }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ total: count ?? 0, byCuisine });
}
