# 🐳 Guide Docker

## 📋 Prérequis

- Docker installé : https://www.docker.com/get-started
- Docker Compose (inclus avec Docker Desktop)

## 🚀 Développement local avec Docker

### Lancer l'application complète

```bash
# Lancer avec Docker Compose (inclut PostgreSQL)
docker-compose up --build

# L'application sera accessible sur http://localhost:8000
# PostgreSQL sera accessible sur localhost:5432
```

### Commandes utiles

```bash
# Arrêter les containers
docker-compose down

# Voir les logs
docker-compose logs -f

# Exécuter des commandes Django dans le container
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser

# Rebuild après modification du code
docker-compose up --build
```

## 🏗️ Build de l'image Docker

### Build manuel

```bash
# Construire l'image
docker build -t restaurants-api .

# Lancer le container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:port/db \
  restaurants-api
```

### Variables d'environnement

Le container nécessite :
- `DATABASE_URL` : URL de connexion PostgreSQL (obligatoire)
- `SECRET_KEY` : Clé secrète Django (optionnel, générée si absente)
- `DEBUG` : Mode debug (défaut: False)
- `ALLOWED_HOSTS` : Hosts autorisés (défaut: *)

## 🌐 Déploiement sur Render

### Méthode 1 : Avec render.yaml (recommandé)

1. **Connecter le repo GitHub** à Render
2. Render détectera automatiquement `render.yaml`
3. **Configurer les variables d'environnement** :
   - `DATABASE_URL` : Ta connexion PostgreSQL Neon
   - `SECRET_KEY` : Générée automatiquement par Render
   - `DEBUG` : `False`
   - `ALLOWED_HOSTS` : `ton-app.onrender.com`

4. Render construira et déploiera automatiquement

### Méthode 2 : Configuration manuelle

1. Crée un **Web Service** sur Render
2. Connecte ton repo GitHub
3. Configuration :
   - **Environment** : `Python 3`
   - **Build Command** : 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command** :
     ```bash
     gunicorn restaurants_api.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Environment Variables** :
     - `DATABASE_URL` : Ta connexion PostgreSQL
     - `SECRET_KEY` : Génère une clé secrète
     - `DEBUG` : `False`
     - `ALLOWED_HOSTS` : `ton-app.onrender.com`

### Notes importantes pour Render

- **Port** : Render utilise la variable `$PORT`, le Dockerfile est configuré pour ça
- **Build** : Le Dockerfile installe Chrome/ChromeDriver pour Selenium
- **Static files** : Collectés automatiquement lors du build
- **Health check** : Configuré sur `/api/restaurants/` dans `render.yaml`

## 🔧 Personnalisation

### Modifier le Dockerfile

Le Dockerfile est optimisé pour :
- Python 3.13
- PostgreSQL
- Selenium avec Chrome
- Gunicorn avec 2 workers

Tu peux modifier :
- Le nombre de workers Gunicorn
- Les dépendances système
- La version de Python

### Variables d'environnement

Crée un fichier `.env` pour le développement local :
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SECRET_KEY=ta-cle-secrete
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🐛 Dépannage

### Le container ne démarre pas

```bash
# Voir les logs
docker-compose logs web

# Vérifier les variables d'environnement
docker-compose exec web env
```

### Erreur de connexion à la base de données

- Vérifie que `DATABASE_URL` est correcte
- Vérifie que la base de données est accessible depuis le container
- Pour Docker Compose, utilise `db` comme host au lieu de `localhost`

### Erreur avec Selenium

- Chrome et ChromeDriver sont installés dans le Dockerfile
- En mode headless, assure-toi que `HEADLESS=True` dans `Cuisine.py`

## 📚 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Render Documentation](https://render.com/docs)
- [Django on Docker](https://docs.djangoproject.com/en/stable/howto/deployment/docker/)
