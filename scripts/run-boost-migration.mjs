/**
 * Applique la migration boost via Postgres (DIRECT_URL dans .env).
 * Usage: npm run db:migrate:boost
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDirectUrl() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(root, name);
    try {
      const raw = readFileSync(path, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^DIRECT_URL=(.+)$/);
        if (match) return match[1].replace(/^"|"$/g, "");
      }
    } catch {
      // try next file
    }
  }
  throw new Error("DIRECT_URL introuvable dans .env.local ou .env");
}

function stripSslMode(url) {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return parsed.toString();
}

const sql = readFileSync(
  resolve(root, "supabase/migrations/20260617120000_add_restaurant_boost.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString: stripSslMode(loadDirectUrl()),
  connectionTimeoutMillis: 60000,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connecté à Postgres, application de la migration…");
  await client.query(sql);
  const { rows } = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name in ('boost_until', 'boost_tier', 'url')
    order by column_name;
  `);
  console.log("Colonnes présentes:", rows.map((r) => r.column_name).join(", "));
  console.log("Migration boost OK.");
} finally {
  await client.end().catch(() => {});
}
