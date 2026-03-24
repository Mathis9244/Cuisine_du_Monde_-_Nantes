# 📚 Guide Swagger/OpenAPI

## 🎯 Accès à la documentation

Une fois le serveur Django lancé, accède à la documentation interactive :

### Swagger UI (Interface interactive)
```
http://localhost:8000/swagger/
```

### ReDoc (Documentation alternative)
```
http://localhost:8000/redoc/
```

### Schema OpenAPI (JSON)
```
http://localhost:8000/swagger.json
```

### Schema OpenAPI (YAML)
```
http://localhost:8000/swagger.yaml
```

## ✨ Fonctionnalités

### 1. Tester les endpoints directement
- Clique sur un endpoint dans Swagger
- Clique sur "Try it out"
- Modifie les paramètres si nécessaire
- Clique sur "Execute"
- Vois la réponse en temps réel

### 2. Voir les schémas de données
- Tous les modèles sont documentés
- Les paramètres de requête sont expliqués
- Les réponses sont typées

### 3. Authentification (si ajoutée plus tard)
- Swagger supporte l'authentification
- Tu peux tester avec différents tokens

## 📖 Exemples d'utilisation

### Tester l'endpoint restaurants
1. Va sur http://localhost:8000/swagger/
2. Trouve `GET /api/restaurants/`
3. Clique sur "Try it out"
4. Ajoute un paramètre `cuisine=italien` (optionnel)
5. Clique sur "Execute"
6. Vois les résultats

### Tester les statistiques
1. Trouve `GET /api/restaurants/stats/`
2. Clique sur "Try it out"
3. Clique sur "Execute"
4. Vois les statistiques globales

## 🔧 Personnalisation

La configuration Swagger se trouve dans `restaurants_api/urls.py` :

```python
schema_view = get_schema_view(
   openapi.Info(
      title="Restaurants du Monde API",
      default_version='v1',
      description="API REST pour les restaurants scrapés depuis Google Maps",
      # ...
   ),
   # ...
)
```

Tu peux modifier :
- Le titre
- La description
- Les informations de contact
- La licence

## 🌐 En production

En production, assure-toi de :
- Désactiver Swagger si tu ne veux pas exposer la documentation publiquement
- Ou restreindre l'accès avec des permissions

Pour désactiver en production, ajoute dans `settings.py` :
```python
if not DEBUG:
    # Retirer drf_yasg de INSTALLED_APPS
    # Ou utiliser des permissions restrictives
```
