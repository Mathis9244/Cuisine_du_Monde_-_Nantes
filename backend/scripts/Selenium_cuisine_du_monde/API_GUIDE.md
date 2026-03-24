# Guide d'utilisation de l'API Django

## 🚀 Démarrage rapide

```bash
# Migrer les données existantes
python migrate_data.py

# Lancer le serveur
python manage.py runserver
```

L'API sera accessible sur : **http://localhost:8000/api/restaurants/**

## 📚 Documentation Swagger/OpenAPI

La documentation interactive de l'API est disponible via Swagger :

- **Swagger UI** : http://localhost:8000/swagger/
- **ReDoc** : http://localhost:8000/redoc/
- **Schema JSON** : http://localhost:8000/swagger.json
- **Schema YAML** : http://localhost:8000/swagger.yaml

Tu peux tester tous les endpoints directement depuis l'interface Swagger !

## 📡 Endpoints disponibles

### 1. Liste des restaurants
```
GET /api/restaurants/
```

**Exemples :**
- `http://localhost:8000/api/restaurants/` - Tous les restaurants
- `http://localhost:8000/api/restaurants/?cuisine=italien` - Restaurants italiens
- `http://localhost:8000/api/restaurants/?search=pizza` - Recherche "pizza"
- `http://localhost:8000/api/restaurants/?ordering=-rating` - Trier par note décroissante

### 2. Détail d'un restaurant
```
GET /api/restaurants/{id}/
```

### 3. Liste des cuisines
```
GET /api/restaurants/cuisines/
```

Retourne toutes les cuisines disponibles.

### 4. Statistiques
```
GET /api/restaurants/stats/
```

Retourne :
- `total_restaurants` : Nombre total de restaurants
- `total_cuisines` : Nombre de cuisines différentes
- `average_rating` : Note moyenne

## 🔍 Filtres et recherche

### Filtres disponibles
- `cuisine` : Filtrer par cuisine (ex: `?cuisine=italien`)
- `search` : Recherche dans nom, cuisine, adresse (ex: `?search=pizza`)
- `ordering` : Trier (ex: `?ordering=-rating` pour décroissant)

### Combinaison de filtres
```
GET /api/restaurants/?cuisine=italien&search=pizza&ordering=-rating
```

## 📄 Pagination

Les résultats sont paginés (50 par page) :
```
GET /api/restaurants/?page=2
```

Réponse :
```json
{
  "count": 135,
  "next": "http://localhost:8000/api/restaurants/?page=3",
  "previous": "http://localhost:8000/api/restaurants/?page=1",
  "results": [...]
}
```

## 🌐 Utilisation depuis JavaScript

```javascript
// Récupérer tous les restaurants
fetch('http://localhost:8000/api/restaurants/')
  .then(response => response.json())
  .then(data => console.log(data));

// Filtrer par cuisine
fetch('http://localhost:8000/api/restaurants/?cuisine=italien')
  .then(response => response.json())
  .then(data => console.log(data));

// Rechercher
fetch('http://localhost:8000/api/restaurants/?search=pizza')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🔐 Admin Django

Accéder à l'interface d'administration :
```
http://localhost:8000/admin/
```

Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

## ⚠️ Note importante sur Netlify

**Netlify n'est pas adapté pour héberger Django** car :
- Netlify est conçu pour les sites statiques
- Django nécessite un serveur WSGI continu
- Netlify Functions ne supporte pas Django

### Alternatives recommandées :
1. **Railway** (gratuit pour commencer) - https://railway.app
2. **Render** (gratuit avec limitations) - https://render.com
3. **Fly.io** (gratuit) - https://fly.io
4. **Heroku** (payant) - https://heroku.com

Voir `README_DJANGO.md` pour les instructions de déploiement.
