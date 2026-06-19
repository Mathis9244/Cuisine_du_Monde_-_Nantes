import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildRestaurantInsertRow,
  normalizeDbRestaurantRow,
} from "@/lib/restaurantDb";
import type { DbRestaurant } from "@/lib/types";
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const cuisine = searchParams.get("cuisine") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("restaurants").select("*", { count: "exact" });

  if (!includeInactive) query = query.eq("is_active", true);
  if (cuisine) query = query.ilike("cuisine", cuisine);
  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},address.ilike.${term}`);
  }

  query = query
    .order("name", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (data as DbRestaurant[]).map((row) => normalizeDbRestaurantRow(row)),
    meta: { total: count ?? 0, page, limit },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<DbRestaurant>;
  if (!body.name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .insert(buildRestaurantInsertRow({ ...body, name: body.name }))
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(normalizeDbRestaurantRow(data as DbRestaurant), { status: 201 });
}
