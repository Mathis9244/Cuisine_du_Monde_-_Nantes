# 📤 Instructions pour publier sur GitHub

## Étape 1 : Créer un repository sur GitHub

1. Va sur https://github.com/new
2. Crée un nouveau repository :
   - **Nom** : `restaurants-du-monde` (ou un nom de ton choix)
   - **Description** : "Scraper Google Maps + API Django REST pour restaurants du monde"
   - **Visibilité** : Public ou Private (selon ton choix)
   - **NE PAS** initialiser avec README, .gitignore ou license (on a déjà tout)

## Étape 2 : Connecter le repository local à GitHub

```bash
# Ajouter le remote GitHub (remplace USERNAME et REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Renommer la branche en 'main' (si GitHub utilise main)
git branch -M main

# Pousser le code
git push -u origin main
```

## Étape 3 : Configurer les secrets (optionnel)

Si tu veux utiliser GitHub Actions pour les tests :

1. Va dans **Settings** → **Secrets and variables** → **Actions**
2. Ajoute un secret `DATABASE_URL` avec ta connexion PostgreSQL

## ✅ C'est fait !

Ton code est maintenant sur GitHub. Tu peux :
- Partager le lien du repository
- Collaborer avec d'autres développeurs
- Utiliser GitHub Actions pour CI/CD
- Déployer depuis GitHub vers Railway/Render/etc.

## 🔗 Liens utiles

- **GitHub** : https://github.com
- **Railway** : https://railway.app (déploiement facile depuis GitHub)
- **Render** : https://render.com (déploiement depuis GitHub)
