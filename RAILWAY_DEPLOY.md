# 🚂 Déploiement sur Railway

## 📋 Étapes de déploiement

### 1. Préparer le code

Assurez-vous que tous les fichiers sont prêts :
- ✅ `src/server.ts` - Serveur HTTP
- ✅ `src/fetcher.ts` - Classe de récupération OSM
- ✅ `package.json` - Configuration
- ✅ `Procfile` - Commande de démarrage Railway
- ✅ `railway.json` - Configuration Railway
- ✅ `nixpacks.toml` - Configuration build

### 2. Pousser sur GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 3. Déployer sur Railway

#### Option A : Via l'interface web (Recommandé)

1. Allez sur [railway.app](https://railway.app)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Sélectionnez **"Deploy from GitHub repo"**
5. Autorisez Railway à accéder à votre GitHub
6. Choisissez votre repository `cuisine-du-monde`
7. Railway détectera automatiquement Bun et déploiera

#### Option B : Via Railway CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Lier à un projet Railway existant ou créer un nouveau
railway link

# Déployer
railway up
```

### 4. Configuration

Railway détectera automatiquement :
- ✅ Le port via `process.env.PORT`
- ✅ Bun via le `Procfile`
- ✅ La commande de démarrage

**Aucune configuration supplémentaire nécessaire !**

### 5. Vérifier le déploiement

Une fois déployé, Railway vous donnera une URL comme :
```
https://votre-projet.railway.app
```

Testez les endpoints :
- `https://votre-projet.railway.app/` - Interface web
- `https://votre-projet.railway.app/api/restaurants` - API restaurants
- `https://votre-projet.railway.app/api/restaurants/stats` - Statistiques

## 🔧 Variables d'environnement

Par défaut, aucune variable d'environnement n'est nécessaire. Le port est automatiquement géré par Railway.

Si vous voulez personnaliser :
- `PORT` - Port du serveur (géré automatiquement par Railway)

## 💾 Persistance des données

### Option 1 : SQLite (par défaut)

La base de données SQLite est créée dans le système de fichiers. Pour la persister :

1. Dans Railway, allez dans votre projet
2. Cliquez sur **"New"** → **"Volume"**
3. Montez le volume sur `/data`
4. Modifiez le code pour utiliser `/data/restaurants.db`

### Option 2 : PostgreSQL (Recommandé pour production)

1. Dans Railway, cliquez sur **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway créera automatiquement les variables d'environnement
3. Modifiez le code pour utiliser PostgreSQL au lieu de SQLite

## 📊 Monitoring

Railway fournit :
- 📈 Logs en temps réel
- 📊 Métriques de performance
- 🔄 Redémarrage automatique en cas d'erreur

## 🎯 Commandes utiles Railway CLI

```bash
# Voir les logs
railway logs

# Ouvrir le shell du service
railway shell

# Voir les variables d'environnement
railway variables

# Redéployer
railway up
```

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez les logs : `railway logs`
2. Vérifiez que Bun est bien installé dans le build
3. Vérifiez que le port est bien `process.env.PORT`

### Erreur de connexion à Overpass

Les serveurs Overpass peuvent être surchargés. Le code essaie automatiquement 3 serveurs différents.

### Base de données vide

1. Appelez l'endpoint `/api/restaurants/fetch` pour récupérer des données
2. Vérifiez les logs pour voir si la récupération a réussi

## ✅ Checklist de déploiement

- [ ] Code poussé sur GitHub
- [ ] Projet créé sur Railway
- [ ] Repository connecté
- [ ] Déploiement réussi
- [ ] URL accessible
- [ ] API fonctionnelle
- [ ] Base de données créée
- [ ] Données récupérées via `/api/restaurants/fetch`

---

**Bon déploiement ! 🚂**
