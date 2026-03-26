# Supabase Auth + JWT (Backend NestJS)

Ce backend conserve l’auth admin existante (`/api/v1/auth/login`) et ajoute une authentification utilisateur **Supabase Auth**.

## Variables d’environnement

Copie `backend/.env.example` vers `backend/.env` et renseigne :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**serveur uniquement**)
- `ENABLE_STARTUP_IMPORT`
- `SUPABASE_IMPORT_TABLE` (par défaut `restaurants`)
- `SUPABASE_IMPORT_MARKER_TABLE` (par défaut `startup_import_runs`)

## Routes Supabase Auth

Base: `/auth`

- `POST /auth/register` (email/password)
- `POST /auth/login` (email/password)
- `POST /auth/refresh` (`refresh_token`)
- `POST /auth/logout` (**protégé**, révoque les refresh tokens via service-role)
- `GET /auth/me` (**protégé**, lit l’utilisateur depuis le JWT Supabase)

Le frontend doit envoyer `Authorization: Bearer <access_token_supabase>`.

## Vérification JWT

Le backend vérifie le JWT Supabase via JWKS remote :

- `SUPABASE_URL/auth/v1/certs`

Cela évite d’utiliser `SUPABASE_JWT_SECRET`.

## Healthcheck

- `GET /health`

Retourne `ok` + état de reachability Supabase.

## Startup import (bootstrap)

Si `ENABLE_STARTUP_IMPORT=true`, au démarrage le backend :

1. vérifie un marqueur dans `SUPABASE_IMPORT_MARKER_TABLE` avec `key="initial"`
2. si absent : upsert les items de `src/modules/bootstrap/seed-data.json` vers `SUPABASE_IMPORT_TABLE`
3. écrit le marqueur pour rendre l’import idempotent

### SQL à créer côté Supabase

Créer une table cible (ex: `restaurants`) avec une colonne unique `source_id` :

```sql
create table if not exists public.restaurants (
  source_id text primary key,
  name text not null,
  city text not null,
  cuisine text null,
  rating double precision null
);
```

Créer la table marqueur :

```sql
create table if not exists public.startup_import_runs (
  key text primary key,
  imported_count integer not null default 0,
  created_at timestamptz not null default now()
);
```

## Tests

Dans `backend/` :

```bash
npm test
```

