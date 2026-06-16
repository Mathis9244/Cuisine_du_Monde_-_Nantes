#!/usr/bin/env python3
"""Google Maps scraper bridge based on Selenium_cuisine_du_monde.

This script imports `Cuisine.py` from the integrated repository and returns
results as JSON on stdout for the NestJS sync endpoint.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


def _normalize_cuisine(raw: str | None) -> str:
    if not raw:
        return "unknown"
    value = raw.strip().lower()
    return re.sub(r"\s+", "_", value)


def _load_source_module(repo_path: Path):
    source_file = repo_path / "Cuisine.py"
    if not source_file.exists():
        raise RuntimeError(f"Fichier introuvable: {source_file}")

    import importlib.util

    spec = importlib.util.spec_from_file_location("selenium_cuisine_module", source_file)
    if spec is None or spec.loader is None:
        raise RuntimeError("Impossible de charger Cuisine.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def scrape_with_selenium(city: str, cuisine: str | None, limit: int, headless: bool) -> list[dict[str, Any]]:
    repo_path = Path(__file__).resolve().parent / "Selenium_cuisine_du_monde"
    module = _load_source_module(repo_path)

    # Configure imported scraper.
    module.CITY = city
    module.HEADLESS = headless
    module.TOP_N = limit
    if cuisine:
        module.CUISINES = [cuisine]

    driver = module.make_driver()
    places: list[Any] = []

    try:
        driver.get("https://www.google.com/maps")
        module.accept_cookies_if_present(driver)
        module.find_search_box(driver)

        cuisines = [cuisine] if cuisine else list(module.CUISINES)
        for current_cuisine in cuisines:
            scraped = module.scrape_top_places_for_cuisine(driver, current_cuisine, city, limit)
            places.extend(scraped)
    finally:
        driver.quit()

    output: list[dict[str, Any]] = []
    for place in places:
        name = getattr(place, "name", None)
        if not name:
            continue
        cuisine_value = getattr(place, "cuisine", None)
        address_value = getattr(place, "address", None)
        source_id = getattr(place, "url", None) or f"{name}-{address_value or ''}"
        output.append(
            {
                "name": name,
                "rating": getattr(place, "rating", None),
                "cuisine": _normalize_cuisine(cuisine_value),
                "address": address_value,
                "city": city,
                "sourceId": source_id,
            }
        )

    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="Nantes")
    parser.add_argument("--cuisine", default=None)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--headless", action="store_true")
    args = parser.parse_args()

    try:
        # Keep scraper deterministic and scoped to this integrated repository.
        os.chdir(Path(__file__).resolve().parent / "Selenium_cuisine_du_monde")
        items = scrape_with_selenium(
            city=args.city,
            cuisine=args.cuisine,
            limit=args.limit,
            headless=args.headless,
        )
        print(json.dumps(items, ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
