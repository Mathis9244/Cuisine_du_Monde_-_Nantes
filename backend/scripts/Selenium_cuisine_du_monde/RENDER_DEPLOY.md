# 🚀 Guide de déploiement sur Render

## 📋 Prérequis

- Compte Render : https://render.com
- Repository GitHub avec le code
- Base de données PostgreSQL (Neon recommandé)

## 🎯 Déploiement rapide

### Option 1 : Déploiement automatique avec render.yaml (Recommandé)

1. **Connecte ton repo GitHub à Render**
   - Va sur https://dashboard.render.com
   - Clique sur "New +" → "Blueprint"
   - Connecte ton repository GitHub
   - Render détectera automatiquement `render.yaml`

2. **Configure les variables d'environnement**
   - `DATABASE_URL` : Ta connexion PostgreSQL Neon
   - `SECRET_KEY` : Générée automatiquement par Render
   - `DEBUG` : `False`
   - `ALLOWED_HOSTS` : `ton-app.onrender.com`

3. **Déploie**
   - Render construira automatiquement avec Docker
   - Le déploiement prendra 5-10 minutes

### Option 2 : Déploiement manuel

1. **Crée un Web Service**
   - Va sur https://dashboard.render.com
   - Clique sur "New +" → "Web Service"
   - Connecte ton repository GitHub

2. **Configuration**
   - **Name** : `restaurants-api` (ou ton choix)
   - **Environment** : `Docker`
   - **Region** : Choisis la région la plus proche
   - **Branch** : `main` (ou ta branche principale)
   - **Root Directory** : `/` (laisser vide)
   - **Dockerfile Path** : `./Dockerfile`
   - **Docker Context** : `.`

3. **Variables d'environnement**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
   SECRET_KEY=<génère une clé secrète>
   DEBUG=False
   ALLOWED_HOSTS=ton-app.onrender.com
   PORT=10000
   ```

4. **Advanced Settings**
   - **Health Check Path** : `/api/restaurants/`
   - **Auto-Deploy** : `Yes` (pour déployer automatiquement à chaque push)

5. **Crée le service**
   - Clique sur "Create Web Service"
   - Render va construire et déployer ton application

## 🔧 Configuration après déploiement

### Migrations de base de données

Une fois déployé, exécute les migrations :

```bash
# Via Render Shell (dans le dashboard)
python manage.py migrate

# Ou via SSH si disponible
render ssh restaurants-api
python manage.py migrate
```

### Migrer les données

Si tu as déjà des données dans PostgreSQL :

```bash
# Via Render Shell
python migrate_data.py
```

### Créer un superutilisateur

```bash
# Via Render Shell
python manage.py createsuperuser
```

## 📊 Vérification

Une fois déployé, vérifie :

1. **Health Check** : https://ton-app.onrender.com/api/restaurants/
2. **Swagger** : https://ton-app.onrender.com/swagger/
3. **ReDoc** : https://ton-app.onrender.com/redoc/
4. **Admin** : https://ton-app.onrender.com/admin/

## 🔐 Sécurité

### Variables d'environnement sensibles

Ne jamais commiter :
- `SECRET_KEY`
- `DATABASE_URL` avec credentials
- Tokens API

Utilise les **Secrets** de Render pour stocker ces valeurs.

### Production

- `DEBUG=False` en production
- `ALLOWED_HOSTS` doit contenir uniquement ton domaine Render
- Utilise HTTPS (automatique sur Render)

## 🐛 Dépannage

### Le build échoue

1. Vérifie les logs dans Render Dashboard
2. Vérifie que `requirements.txt` est à jour
3. Vérifie que le Dockerfile est correct

### L'application ne démarre pas

1. Vérifie les logs : `render logs restaurants-api`
2. Vérifie les variables d'environnement
3. Vérifie la connexion à la base de données

### Erreur 500

1. Active temporairement `DEBUG=True` pour voir les erreurs
2. Vérifie les logs détaillés
3. Vérifie que les migrations sont appliquées

## 📈 Monitoring

Render fournit :
- **Logs en temps réel** : Dashboard → Logs
- **Métriques** : CPU, RAM, Requêtes
- **Health checks** : Vérification automatique de l'endpoint

## 💰 Coûts

- **Free Tier** : Gratuit avec limitations
  - Services peuvent "s'endormir" après inactivité
  - Redémarrage automatique à la première requête
- **Starter Plan** : $7/mois pour un service toujours actif

## 🔄 Mises à jour

Les mises à jour se font automatiquement si **Auto-Deploy** est activé :
- Push sur la branche principale → Déploiement automatique
- Ou manuellement via "Manual Deploy" dans le dashboard

## 📚 Ressources

- [Render Documentation](https://render.com/docs)
- [Django on Render](https://render.com/docs/deploy-django)
- [Docker on Render](https://render.com/docs/docker)
