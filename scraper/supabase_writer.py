#!/usr/bin/env python3
"""Écriture directe des restaurants dans Supabase (PostgREST).

Ce module est volontairement indépendant : il n'appelle JAMAIS le backend/web.
Il upsert les restaurants dans la table `restaurants` en se basant sur la
contrainte d'unicité (source, source_id).
"""

from __future__ import annotations

import os
from typing import Any

import requests


class SupabaseWriter:
    def __init__(self, url: str | None = None, service_role_key: str | None = None):
        self.url = (url or os.environ.get("SUPABASE_URL", "")).rstrip("/")
        self.key = service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not self.url or not self.key:
            raise RuntimeError(
                "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis."
            )
        self.table = os.environ.get("SUPABASE_RESTAURANTS_TABLE", "restaurants")

    def _headers(self) -> dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            # Upsert : fusionne les doublons sur la contrainte (source, source_id)
            "Prefer": "resolution=merge-duplicates,return=representation",
        }

    def upsert(self, rows: list[dict[str, Any]]) -> int:
        """Upsert une liste de restaurants. Renvoie le nombre de lignes traitées."""
        if not rows:
            return 0
        endpoint = f"{self.url}/rest/v1/{self.table}?on_conflict=source,source_id"
        response = requests.post(
            endpoint, json=rows, headers=self._headers(), timeout=60
        )
        if response.status_code >= 300:
            raise RuntimeError(
                f"Upsert Supabase échoué ({response.status_code}): {response.text}"
            )
        try:
            return len(response.json())
        except ValueError:
            return len(rows)
