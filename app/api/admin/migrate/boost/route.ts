import { NextResponse } from "next/server";
import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { requireAdmin } from "@/lib/auth";

const MIGRATION_FILE = resolve(
  process.cwd(),
  "supabase/migrations/20260617120000_add_restaurant_boost.sql",
);

function withSsl(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return parsed.toString();
}

/** Plusieurs URLs Postgres (pooler session, hôte direct Supabase). */
function getMigrationUrls(): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  const push = (raw?: string) => {
    if (!raw) return;
    const normalized = withSsl(raw);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  };

  push(process.env.DIRECT_URL);

  const direct = process.env.DIRECT_URL;
  if (direct) {
    try {
      const parsed = new URL(direct);
      const user = decodeURIComponent(parsed.username);
      const password = decodeURIComponent(parsed.password);
      const projectRef = user.replace(/^postgres\./, "");
      if (projectRef && password) {
        push(
          `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
        );
      }
    } catch {
      /* ignore malformed URL */
    }
  }

  const database = process.env.DATABASE_URL;
  if (database) {
    push(
      database
        .replace(":6543/", ":5432/")
        .replace(/\?pgbouncer=true&?/, "?")
        .replace(/\?$/, ""),
    );
  }

  return urls;
}

async function runMigration(sql: string): Promise<{ columns: string[] }> {
  const candidates = getMigrationUrls();
  if (candidates.length === 0) {
    throw new Error(
      "DIRECT_URL ou DATABASE_URL manquant. Exécutez le SQL dans Supabase → SQL Editor.",
    );
  }

  let lastError: Error | null = null;

  for (const connectionString of candidates) {
    const client = new pg.Client({
      connectionString,
      connectionTimeoutMillis: 20000,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      await client.query(sql);
      const { rows } = await client.query<{ column_name: string }>(`
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'restaurants'
          and column_name in ('boost_until', 'boost_tier', 'url')
        order by column_name;
      `);
      return { columns: rows.map((r) => r.column_name) };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      await client.end().catch(() => {});
    }
  }

  throw lastError ?? new Error("Connexion Postgres impossible");
}

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sql = readFileSync(MIGRATION_FILE, "utf8");

  try {
    const result = await runMigration(sql);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur migration";
    return NextResponse.json(
      {
        error: message,
        hint: "Si la connexion échoue, copiez le fichier supabase/migrations/20260617120000_add_restaurant_boost.sql dans Supabase → SQL Editor → Run.",
        sql,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sql = readFileSync(MIGRATION_FILE, "utf8");
  return NextResponse.json({
    file: "supabase/migrations/20260617120000_add_restaurant_boost.sql",
    sql,
    urlsTried: getMigrationUrls().map((u) => u.replace(/:[^:@]+@/, ":***@")),
  });
}
