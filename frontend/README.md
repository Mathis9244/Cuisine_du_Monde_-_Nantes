## Nantes World Eats (Vite + Supabase Auth)

Frontend Vite/React connecté au backend NestJS.

### Prérequis

- Node.js
- Un projet Supabase (Auth activé)

### Configuration

Crée un fichier `.env.local` à la racine du dossier `frontend/` en te basant sur `.env.example` :

- `VITE_BACKEND_URL` (ex: `http://localhost:3001`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optionnel (si tu utilises l’onglet AI) :

- `VITE_GEMINI_API_KEY`

### Lancer en local

```bash
npm install
npm run dev
```


