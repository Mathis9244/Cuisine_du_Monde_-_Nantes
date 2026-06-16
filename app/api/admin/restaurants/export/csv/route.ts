import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DbRestaurant } from "@/lib/types";

const CUISINE_TO_COUNTRY: Record<string, string> = {
  chinese: "Chine",
  japanese: "Japon",
  indian: "Inde",
  thai: "Thaïlande",
  vietnamese: "Vietnam",
  korean: "Corée",
  lebanese: "Liban",
  turkish: "Turquie",
  italian: "Italie",
  french: "France",
  spanish: "Espagne",
  greek: "Grèce",
  mexican: "Mexique",
  american: "États-Unis",
  moroccan: "Maroc",
  mediterranean: "Méditerranée",
  asian: "Asie",
  seafood: "Fruits de mer",
};

const FRENCH_KEYWORDS = [
  "french",
  "français",
  "française",
  "bistrot",
  "brasserie",
  "bouchon",
  "crepe",
  "crêpe",
  "galette",
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const excludeFrench =
    new URL(request.url).searchParams.get("excludeFrench") === "true";

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const restaurants = (data ?? []) as DbRestaurant[];
  const rows: string[][] = [
    ["nom", "typedecuisine", "adresse", "ville", "lien_google_maps", "phone"],
  ];

  for (const r of restaurants) {
    const cuisineLower = (r.cuisine ?? "").toLowerCase();
    if (excludeFrench && FRENCH_KEYWORDS.some((k) => cuisineLower.includes(k))) {
      continue;
    }
    const country = CUISINE_TO_COUNTRY[cuisineLower] || r.cuisine || "";
    if (excludeFrench && !country) continue;

    const lat = r.latitude ?? null;
    const lon = r.longitude ?? null;
    const googleMaps =
      lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : "";

    rows.push([
      r.name,
      country,
      r.address ?? "",
      r.city ?? "Nantes",
      googleMaps,
      r.phone ?? "",
    ]);
  }

  const csv = rows
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="restaurants_nantes.csv"',
    },
  });
}
