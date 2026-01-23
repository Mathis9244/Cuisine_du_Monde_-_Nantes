# 🍽️ Cuisine du Monde - Restaurants Nantes API

API pour récupérer les restaurants à Nantes avec leurs types de cuisines depuis **OpenStreetMap**, utilisant **Bun** et déployable sur **Railway**.

## 🚀 Déploiement sur Railway

### Méthode 1 : Via GitHub (Recommandé)

1. **Poussez votre code sur GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connectez Railway à GitHub**
   - Allez sur [railway.app](https://railway.app)
   - Créez un compte ou connectez-vous
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository

3. **Railway détectera automatiquement Bun**
   - Railway utilisera le `Procfile` ou `railway.json`
   - Le serveur démarrera automatiquement

### Méthode 2 : Via Railway CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

## 📡 API Endpoints

Une fois déployé, votre API sera disponible sur `https://votre-projet.railway.app`

### GET `/api/restaurants`
Récupère tous les restaurants

**Query params:**
- `cuisine` - Filtrer par cuisine (ex: `?cuisine=italian`)
- `limit` - Limiter le nombre de résultats (ex: `?limit=50`)

**Exemple:**
```bash
curl https://votre-projet.railway.app/api/restaurants?cuisine=japanese&limit=10
```

### GET `/api/restaurants/stats`
Statistiques des restaurants

**Exemple:**
```bash
curl https://votre-projet.railway.app/api/restaurants/stats
```

### POST `/api/restaurants/fetch`
Récupère de nouveaux restaurants depuis OpenStreetMap

**Body (JSON):**
```json
{
  "cuisine": "italian"  // optionnel
}
```

**Exemple:**
```bash
curl -X POST https://votre-projet.railway.app/api/restaurants/fetch \
  -H "Content-Type: application/json" \
  -d '{"cuisine": "japanese"}'
```

### GET `/api/restaurants/export/csv`
Exporte les restaurants en CSV

**Exemple:**
```bash
curl https://votre-projet.railway.app/api/restaurants/export/csv -o restaurants.csv
```

### GET `/`
Interface web avec documentation de l'API

## 💾 Base de données

Le projet utilise **SQLite** intégré dans Bun. La base de données est créée automatiquement au premier démarrage.

**Structure:**
```sql
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cuisine TEXT,
  address TEXT,
  city TEXT DEFAULT 'Nantes',
  latitude REAL,
  longitude REAL,
  osm_id TEXT,
  osm_type TEXT,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🛠️ Développement local

### Prérequis

- [Bun](https://bun.sh) installé

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-username/cuisine-du-monde.git
cd cuisine-du-monde

# Installer Bun (si pas déjà fait)
curl -fsSL https://bun.sh/install | bash
```

### Lancer le serveur

```bash
bun run src/server.ts
```

Le serveur sera disponible sur `http://localhost:3000`

## 📊 Format CSV

Le CSV exporté contient :

- **nom** - Nom du restaurant
- **typedecuisine** - Pays d'origine (Chine, Japon, Italie, etc.)
- **adresse** - Adresse complète
- **ville** - Nantes
- **lien_google_maps** - Lien cliquable vers Google Maps
- **phone** - Numéro de téléphone

**Note :** Les restaurants français sont automatiquement exclus.

## 🔧 Configuration Railway

### Variables d'environnement

Railway détecte automatiquement le port via `process.env.PORT`. Aucune configuration supplémentaire n'est nécessaire.

### Persistance des données

Par défaut, SQLite sauvegarde dans le système de fichiers. Pour une persistance permanente sur Railway, vous pouvez :

1. Utiliser Railway Volumes pour persister la base de données
2. Migrer vers PostgreSQL (Railway propose une base PostgreSQL gratuite)

## 📝 Structure du projet

```
cuisine_du_monde/
├── src/
│   ├── server.ts      # Serveur HTTP avec Bun
│   ├── fetcher.ts     # Classe pour récupérer depuis OSM
│   └── index.ts       # Script CLI (optionnel)
├── package.json       # Configuration Bun
├── Procfile          # Configuration Railway
├── railway.json      # Configuration Railway avancée
└── nixpacks.toml     # Configuration build Railway
```

## 🎯 Fonctionnalités

- ✅ API REST complète
- ✅ Interface web avec documentation
- ✅ Base de données SQLite intégrée
- ✅ Export CSV
- ✅ Filtrage par cuisine
- ✅ Statistiques
- ✅ CORS activé
- ✅ Déploiement Railway prêt

## 📄 Licence

MIT

---

**Bon déploiement ! 🚀**
