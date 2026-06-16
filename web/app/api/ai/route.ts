import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toRestaurant } from "@/lib/mappers";
import type { DbRestaurant } from "@/lib/types";

/**
 * Assistant culinaire (Gemini). La clé API reste côté serveur.
 * Le contexte (restaurants actifs) est récupéré en base, pas envoyé par le client.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistant IA non configuré (GEMINI_API_KEY manquant)." },
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return NextResponse.json({
      reply: response.text ?? "Désolé, je n'ai pas pu générer de réponse.",
    });
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
