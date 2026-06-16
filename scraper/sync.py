#!/usr/bin/env python3
"""Worker de synchronisation des restaurants vers Supabase.

Sources disponibles :
  - osm     : OpenStreetMap (Overpass) — rapide, sans navigateur
  - google  : Google Maps via Selenium  — nécessite Chrome/WebDriver

Le worker écrit DIRECTEMENT dans Supabase. Il n'appelle pas l'application web.

Exemples :
  python sync.py --source osm
  python sync.py --source google --city Nantes --limit 5 --headless
  python sync.py --source all --cuisine italian
"""

from __future__ import annotations

import argparse
import sys
from typing import Any

from osm_fetcher import fetch_osm_restaurants
from supabase_writer import SupabaseWriter


def _run_google(city: str, cuisine: str | None, limit: int, headless: bool) -> list[dict[str, Any]]:
    # Import différé : évite de charger Selenium si on ne fait que de l'OSM.
    from google_maps_scraper import scrape_with_selenium

    items = scrape_with_selenium(
        city=city, cuisine=cuisine, limit=limit, headless=headless
    )
    rows: list[dict[str, Any]] = []
    for item in items:
        rows.append(
            {
                "name": item["name"],
                "rating": item.get("rating"),
                "cuisine": item.get("cuisine"),
                "address": item.get("address"),
                "city": item.get("city") or city,
                "source": "google_maps",
                "source_id": item.get("sourceId") or item["name"],
                "is_active": True,
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync restaurants -> Supabase")
    parser.add_argument(
        "--source", choices=["osm", "google", "all"], default="osm"
    )
    parser.add_argument("--city", default="Nantes")
    parser.add_argument("--cuisine", default=None)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--headless", action="store_true")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="N'écrit pas dans Supabase, affiche seulement le nombre récupéré.",
    )
    args = parser.parse_args()

    rows: list[dict[str, Any]] = []

    if args.source in ("osm", "all"):
        osm_rows = fetch_osm_restaurants(args.cuisine)
        print(f"[osm] {len(osm_rows)} restaurants récupérés", file=sys.stderr)
        rows.extend(osm_rows)

    if args.source in ("google", "all"):
        google_rows = _run_google(
            city=args.city,
            cuisine=args.cuisine,
            limit=args.limit,
            headless=args.headless,
        )
        print(f"[google] {len(google_rows)} restaurants récupérés", file=sys.stderr)
        rows.extend(google_rows)

    if args.dry_run:
        print(f"[dry-run] {len(rows)} restaurants (aucune écriture)", file=sys.stderr)
        return 0

    writer = SupabaseWriter()
    saved = writer.upsert(rows)
    print(f"[supabase] {saved} restaurants upsertés", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
