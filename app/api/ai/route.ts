import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toRestaurant } from "@/lib/mappers";
import type { DbRestaurant } from "@/lib/types";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

/**
 * Assistant culinaire via NVIDIA / OpenAI-compatible API.
 * Le contexte (restaurants actifs) est récupéré en base, pas envoyé par le client.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistant IA non configuré (NVIDIA_API_KEY manquant)." },
      { status: 503 },
    );
  }

  let message = "";
  try {
    const body = (await request.json()) as { message?: string };
    message = (body.message ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .limit(200);

  const restaurants = ((data ?? []) as DbRestaurant[]).map(toRestaurant);

  const prompt = `Tu es un assistant culinaire expert pour Nantes, France. Utilise la liste de restaurants ci-dessous comme base de connaissances principale pour recommander des adresses. Sois concis, amical et utile.

Restaurants (contexte) :
${JSON.stringify(restaurants, null, 2)}

Question de l'utilisateur : ${message}`;

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "z-ai/glm-5.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 1,
        top_p: 1,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `NVIDIA API error (${response.status}): ${errorText || "request failed"}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const reply =
      data.choices?.[0]?.message?.content ??
      "Désolé, je n'ai pas pu générer de réponse.";

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erreur de l'assistant IA",
      },
      { status: 500 },
    );
  }
}
