# API Django - Restaurants du Monde

API REST pour exposer les données de restaurants scrapées depuis Google Maps.

## 🚀 Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur (optionnel)
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

L'API sera accessible sur : http://localhost:8000/api/restaurants/

## 📡 Endpoints API

### Liste des restaurants
```
GET /api/restaurants/
```

### Filtres disponibles
- `?cuisine=italien` - Filtrer par cuisine
- `?search=nom` - Rechercher par nom
- `?min_rating=4.0` - Note minimale
- `?ordering=-rating` - Trier par note décroissante

### Endpoints spéciaux
- `GET /api/restaurants/cuisines/` - Liste toutes les cuisines disponibles
- `GET /api/restaurants/stats/` - Statistiques globales

## 🌐 Déploiement

### ⚠️ Important : Netlify n'est pas adapté pour Django

Netlify est conçu pour les sites statiques et les fonctions serverless, pas pour les applications Django qui nécessitent un serveur WSGI continu.

### Alternatives recommandées pour Django :

1. **Railway** (recommandé - gratuit pour commencer)
   ```bash
   # Installer Railway CLI
   npm i -g @railway/cli
   
   # Se connecter
   railway login
   
   # Déployer
   railway up
   ```

2. **Render** (gratuit avec limitations)
   - Connecter ton repo GitHub
   - Créer un nouveau Web Service
   - Configurer : `gunicorn restaurants_api.wsgi:application`

3. **Fly.io** (gratuit)
   ```bash
   flyctl launch
   flyctl deploy
   ```

4. **Heroku** (payant maintenant)
   ```bash
   heroku create
   git push heroku main
   ```

### Configuration pour le déploiement

1. Créer un fichier `.env` avec :
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=ton-secret-key
   DEBUG=False
   ```

2. Les variables d'environnement seront automatiquement chargées

## 📝 Notes

- L'API utilise PostgreSQL (Neon) configuré dans `DATABASE_URL`
- CORS est activé pour permettre les requêtes depuis le frontend
- La pagination est activée (50 résultats par page)
