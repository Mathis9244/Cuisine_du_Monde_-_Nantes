# Scraper / Worker de synchronisation

Service **autonome** qui alimente la table `restaurants` de **Supabase**.
Il n'interagit **jamais** avec l'application web (`web/`) : il écrit directement
dans Supabase via l'API PostgREST avec la clé *service role*.

## Sources

| Source   | Description                              | Prérequis            |
|----------|------------------------------------------|----------------------|
| `osm`    | OpenStreetMap (Overpass API)             | Aucun (HTTP)         |
| `google` | Google Maps via Selenium                 | Chrome + WebDriver   |
| `all`    | Les deux                                 | Chrome + WebDriver   |

## Installation

```bash
cd scraper
python -m venv .venv
# Windows : .venv\Scripts\activate   |   macOS/Linux : source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # puis renseigner SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
```

> Si vous n'utilisez que `--source osm`, seules `requests` est nécessaire.

## Utilisation

```bash
# OpenStreetMap (rapide, sans navigateur)
python sync.py --source osm

# Google Maps (Selenium, headless)
python sync.py --source google --city Nantes --limit 5 --headless

# Les deux, filtré sur une cuisine
python sync.py --source all --cuisine italian

# Tester sans écrire dans Supabase
python sync.py --source osm --dry-run
```

## Fonctionnement

1. Récupère les restaurants depuis la/les source(s).
2. Upsert dans Supabase sur la contrainte d'unicité `(source, source_id)`
   (créée par `web/supabase/schema.sql`).

## Planification (cron / job)

Exécutez `python sync.py --source osm` régulièrement (cron, GitHub Action,
job Docker planifié). Le worker est sans état : il peut être relancé sans risque
de doublons grâce à l'upsert.

## Contenu

- `sync.py` — point d'entrée (CLI)
- `osm_fetcher.py` — récupération OpenStreetMap (Overpass)
- `google_maps_scraper.py` — pont vers le scraper Selenium
- `supabase_writer.py` — upsert PostgREST vers Supabase
- `Selenium_cuisine_du_monde/Cuisine.py` — logique de scraping Selenium d'origine
