# 🍽️ Cuisine du Monde - Nantes

Application web de consultation et d'administration des restaurants du monde à
Nantes. Architecture refondue en **Next.js full-stack** (front + API dans la même
app) connecté à **Supabase** (base de données + authentification), avec un
**scraper Python autonome** séparé.

## 🏗️ Architecture

```
├── web/        # App Next.js (App Router) : front + Route Handlers (API) -> Supabase
└── scraper/    # Worker Python autonome : OSM + Google Maps -> écrit dans Supabase
```

- **Front + Backend** : une seule app Next.js. Le « backend » correspond aux
  Route Handlers sous `web/app/api/**` qui parlent à Supabase.
- **Auth** : Supabase (utilisateurs et admin). Le rôle admin est porté par le JWT
  (`role: "admin"` dans `app_metadata`/`user_metadata`).
- **Données** : table `restaurants` dans Supabase.
- **Scraper** : worker indépendant qui écrit **directement** dans Supabase, sans
  jamais passer par l'app web.

## 🚀 Démarrage

### 1. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL, exécutez `web/supabase/schema.sql`.
3. Récupérez : `Project URL`, `anon key`, `service_role key`.

### 2. Lancer l'app web (dev)

```bash
cd web
npm install
copy .env.example .env.local   # (cp sur macOS/Linux), puis renseigner les clés Supabase
npm run dev
```

- App : http://localhost:3000
- Back-office admin : http://localhost:3000/admin

> **Compte admin** : créez un compte via l'app, puis promouvez-le en admin
> (voir instructions en bas de `web/supabase/schema.sql`).

### 3. Alimenter la base (scraper)

```bash
cd scraper
pip install -r requirements.txt
copy .env.example .env          # renseigner SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
python sync.py --source osm     # import OpenStreetMap
python sync.py --source google --limit 5 --headless   # import Google Maps (Selenium)
```

## 🐳 Docker

```bash
# Renseigner les variables d'env (NEXT_PUBLIC_SUPABASE_URL, etc.) dans un .env à la racine
docker compose up -d --build
```

App disponible sur http://localhost:3000.

## 📡 API (Route Handlers)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/restaurants` | – | Liste + filtres (cuisine, search, pagination, tri) |
| GET | `/api/restaurants/stats` | – | Statistiques (total, par cuisine) |
| GET | `/api/restaurants/cuisines` | – | Types de cuisines |
| GET | `/api/restaurants/:id` | – | Détail d'un restaurant actif |
| GET | `/api/auth/me` | session | Utilisateur courant (+ isAdmin) |
| GET | `/api/admin/restaurants` | admin | Liste admin (inclut inactifs) |
| POST | `/api/admin/restaurants` | admin | Créer un restaurant |
| GET/PUT | `/api/admin/restaurants/:id` | admin | Détail / modification |
| PATCH | `/api/admin/restaurants/:id/activate` | admin | Réactiver |
| PATCH | `/api/admin/restaurants/:id/deactivate` | admin | Désactiver |
| GET | `/api/admin/restaurants/export/csv` | admin | Export CSV |
| POST | `/api/ai` | – | Assistant culinaire (Gemini, clé côté serveur) |

## 🔐 Sécurité

- Auth via Supabase (JWT). RLS activée : lecture publique des restaurants actifs.
- Les écritures admin utilisent la clé `service_role` **côté serveur uniquement**.
- Clé Gemini jamais exposée au navigateur (appel via `/api/ai`).

## 📄 Licence

MIT
