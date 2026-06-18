import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toRestaurant } from "@/lib/mappers";
import { isMissingBoostColumnError } from "@/lib/dbBoost";
import type { DbRestaurant } from "@/lib/types";
const SORT_COLUMNS: Record<string, string> = {
  name: "name",
  rating: "rating",
  createdAt: "created_at",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cuisine = searchParams.get("cuisine") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20),
  );
  const sortBy = SORT_COLUMNS[searchParams.get("sortBy") ?? "name"] ?? "name";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? false : true;
  const minRating = parseFloat(searchParams.get("minRating") ?? "0") || 0;
  const hasWebsite = searchParams.get("hasWebsite") === "true";
  const hasPhone = searchParams.get("hasPhone") === "true";
  const spotlight = searchParams.get("spotlight") === "true";

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("restaurants")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (spotlight) {
    query = query
      .not("boost_until", "is", null)
      .gt("boost_until", new Date().toISOString());
  }

  if (cuisine) query = query.ilike("cuisine", cuisine);
  if (minRating > 0) query = query.gte("rating", minRating);
  if (hasWebsite) query = query.not("website", "is", null).neq("website", "");
  if (hasPhone) query = query.not("phone", "is", null).neq("phone", "");
  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},address.ilike.${term},cuisine.ilike.${term},phone.ilike.${term},website.ilike.${term}`,
    );
  }

  if (spotlight) {
    query = query
      .order("boost_tier", { ascending: false })
      .order("boost_until", { ascending: false });
  } else {
    query = query.order(sortBy, { ascending: sortOrder });
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    if (spotlight && isMissingBoostColumnError(error.message)) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const total = count ?? 0;
  return NextResponse.json({
    data: (data as DbRestaurant[]).map(toRestaurant),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
