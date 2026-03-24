# 🌍 Restaurants du Monde - Scraper & API

Application complète pour scraper les restaurants depuis Google Maps et exposer les données via une API Django REST.

## 📋 Fonctionnalités

- 🕷️ **Scraping automatique** : Scrape les restaurants depuis Google Maps avec Selenium
- 🗄️ **Base de données PostgreSQL** : Stockage dans Neon (PostgreSQL)
- 🚀 **API REST Django** : API complète avec filtres, recherche et pagination
- 📊 **135 cuisines** : Support de 135 cuisines du monde entier
- 📄 **Export CSV** : Export automatique des données

## 🛠️ Technologies

- **Python 3.13**
- **Selenium** : Scraping web
- **Django 6.0** : Framework web
- **Django REST Framework** : API REST
- **PostgreSQL (Neon)** : Base de données
- **psycopg2** : Driver PostgreSQL

## 📦 Installation

### Prérequis

- Python 3.13+
- Chrome/Chromium installé
- Compte PostgreSQL (Neon recommandé)

### Installation des dépendances

```bash
pip install -r requirements.txt
```

### Configuration

1. Créer un fichier `.env` (optionnel) :
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

Ou modifier directement `DATABASE_URL` dans `Cuisine.py` et `restaurants_api/settings.py`.

## 🚀 Utilisation

### 1. Scraping des restaurants

```bash
python Cuisine.py
```

Le script va :
- Scraper les 135 cuisines configurées
- Récupérer 5 restaurants par cuisine (configurable via `TOP_N`)
- Sauvegarder dans PostgreSQL
- Générer un CSV automatiquement

**Configuration** (dans `Cuisine.py`) :
- `CITY` : Ville à rechercher (défaut: "Nantes")
- `TOP_N` : Nombre de restaurants par cuisine (défaut: 5)
- `HEADLESS` : Mode headless (défaut: False)
- `PAUSE_BETWEEN_CUISINES` : Pause entre cuisines en secondes (défaut: 3)

### 2. API Django

#### Initialisation

```bash
# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Migrer les données depuis PostgreSQL
python migrate_data.py

# Créer un superutilisateur (optionnel)
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

L'API sera accessible sur : **http://localhost:8000/api/restaurants/**

#### Endpoints disponibles

- `GET /api/restaurants/` - Liste tous les restaurants
- `GET /api/restaurants/{id}/` - Détail d'un restaurant
- `GET /api/restaurants/cuisines/` - Liste des cuisines
- `GET /api/restaurants/stats/` - Statistiques

#### Filtres

- `?cuisine=italien` - Filtrer par cuisine
- `?search=pizza` - Rechercher
- `?ordering=-rating` - Trier par note

Voir `API_GUIDE.md` pour plus de détails.

## 📁 Structure du projet

```
.
├── Cuisine.py              # Script principal de scraping
├── manage.py               # Django management
├── restaurants/            # App Django
│   ├── models.py          # Modèle Restaurant
│   ├── views.py           # Vues API
│   ├── serializers.py     # Sérialiseurs REST
│   └── urls.py            # URLs de l'app
├── restaurants_api/       # Configuration Django
│   ├── settings.py        # Settings Django
│   └── urls.py            # URLs principales
├── migrate_data.py        # Script de migration PostgreSQL → Django
├── requirements.txt       # Dépendances Python
├── Procfile              # Configuration pour déploiement
└── README.md             # Ce fichier
```

## 🐳 Déploiement avec Docker

### Développement local avec Docker Compose

```bash
# Lancer l'application avec Docker Compose
docker-compose up --build

# L'application sera accessible sur http://localhost:8000
```

### Build de l'image Docker

```bash
# Construire l'image
docker build -t restaurants-api .

# Lancer le container
docker run -p 8000:8000 -e DATABASE_URL=postgresql://... restaurants-api
```

## 🌐 Déploiement sur Render

### Option 1 : Déploiement automatique avec render.yaml

1. Connecte ton repo GitHub à Render
2. Render détectera automatiquement le fichier `render.yaml`
3. Configure la variable d'environnement `DATABASE_URL`
4. Render déploiera automatiquement avec Docker

### Option 2 : Déploiement manuel

1. Crée un nouveau **Web Service** sur Render
2. Connecte ton repo GitHub
3. Configuration :
   - **Build Command** : `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command** : `gunicorn restaurants_api.wsgi:application --bind 0.0.0.0:$PORT`
   - **Environment** : 
     - `DATABASE_URL` : Ta connexion PostgreSQL
     - `SECRET_KEY` : Génère une clé secrète
     - `DEBUG` : `False`
     - `ALLOWED_HOSTS` : `ton-app.onrender.com`

### Alternatives recommandées :

1. **Railway** (recommandé - gratuit pour commencer)
   ```bash
   npm i -g @railway/cli
   railway login
   railway up
   ```

2. **Fly.io** (gratuit)
   ```bash
   flyctl launch
   flyctl deploy
   ```

Voir `README_DJANGO.md` pour les instructions détaillées.

## 📊 Données

- **135 cuisines** disponibles
- **Mapping pays → cuisine** : Dictionnaire complet dans `Cuisine.py`
- **Export CSV** : Format avec URLs Google Maps au format search

## 🔧 Configuration avancée

### Personnaliser les cuisines

Dans `Cuisine.py`, modifier `CUISINES` :

```python
# Liste complète (par défaut)
CUISINES = sorted(list(set(PAYS_TO_CUISINE.values())))

# Ou liste personnalisée
CUISINES = [
    "italien",
    "japonais",
    "mexicain",
    # ...
]
```

### Anti-captcha

Si Google bloque :
- Mettre `HEADLESS = False`
- Augmenter `PAUSE_BETWEEN_CUISINES` à 5 secondes
- Réduire le nombre de cuisines

## 📝 License

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésite pas à ouvrir une issue ou une pull request.

## 📧 Support

Pour toute question, ouvre une issue sur GitHub.
