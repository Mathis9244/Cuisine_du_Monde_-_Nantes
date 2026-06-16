#!/usr/bin/env python3
"""Récupération des restaurants de Nantes depuis OpenStreetMap (Overpass API).

Port Python de l'ancien service NestJS, pour fonctionner en worker autonome.
"""

from __future__ import annotations

import re
from typing import Any

import requests

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
]

# Bounding box Nantes : (sud, ouest, nord, est)
NANTES_BBOX = "47.18,-1.60,47.25,-1.50"

_CUISINE_MAP = {
    "italien": "italian",
    "italienne": "italian",
    "français": "french",
    "française": "french",
    "japonais": "japanese",
    "japonaise": "japanese",
    "chinois": "chinese",
    "chinoise": "chinese",
    "indien": "indian",
    "indienne": "indian",
    "mexicain": "mexican",
    "mexicaine": "mexican",
    "thaï": "thai",
    "thaïlandais": "thai",
    "thaïlandaise": "thai",
    "libanais": "lebanese",
    "libanaise": "lebanese",
    "espagnol": "spanish",
    "espagnole": "spanish",
    "grec": "greek",
    "grecque": "greek",
    "turc": "turkish",
    "turque": "turkish",
    "marocain": "moroccan",
    "marocaine": "moroccan",
    "vietnamien": "vietnamese",
    "vietnamienne": "vietnamese",
    "coréen": "korean",
    "coréenne": "korean",
    "américain": "american",
    "américaine": "american",
    "méditerranéen": "mediterranean",
    "méditerranéenne": "mediterranean",
    "asiatique": "asian",
    "fruits_de_mer": "seafood",
    "poisson": "seafood",
}

_KNOWN = {
    "italian", "french", "japanese", "chinese", "indian", "mexican", "thai",
    "lebanese", "spanish", "greek", "turkish", "moroccan", "vietnamese",
    "korean", "american", "mediterranean", "asian", "seafood",
}


def _normalize_cuisine(cuisine: str | None) -> str | None:
    if not cuisine:
        return None
    lower = cuisine.lower().strip().split(";")[0].strip()
    if lower in _CUISINE_MAP:
        return _CUISINE_MAP[lower]
    if lower in _KNOWN:
        return lower
    return lower if len(lower) < 30 else None


def _parse_element(el: dict[str, Any]) -> dict[str, Any] | None:
    tags = el.get("tags", {}) or {}
    name = tags.get("name")
    if not name:
        return None

    lat = el.get("lat")
    lon = el.get("lon")
    if el.get("type") == "way" and el.get("center"):
        lat = el["center"].get("lat")
        lon = el["center"].get("lon")

    parts = []
    for key in ("addr:housenumber", "addr:street", "addr:postcode", "addr:city"):
        if tags.get(key):
            parts.append(tags[key])

    return {
        "name": name,
        "cuisine": _normalize_cuisine(tags.get("cuisine")),
        "address": ", ".join(parts) or None,
        "city": tags.get("addr:city") or "Nantes",
        "latitude": lat,
        "longitude": lon,
        "website": tags.get("website"),
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "source": "osm",
        "source_id": str(el.get("id")),
        "is_active": True,
    }


def fetch_osm_restaurants(cuisine: str | None = None) -> list[dict[str, Any]]:
    cuisine_filter = f'["cuisine"~"{cuisine}",i]' if cuisine else ""
    query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"]{cuisine_filter}({NANTES_BBOX});
          way["amenity"="restaurant"]{cuisine_filter}({NANTES_BBOX});
        );
        out center;
    """

    for url in OVERPASS_URLS:
        try:
            response = requests.post(
                url,
                data=query.encode("utf-8"),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=40,
            )
            response.raise_for_status()
            data = response.json()
            results = []
            for el in data.get("elements", []):
                parsed = _parse_element(el)
                if parsed:
                    results.append(parsed)
            return results
        except Exception:  # noqa: BLE001 - on tente l'URL suivante
            continue
    return []
