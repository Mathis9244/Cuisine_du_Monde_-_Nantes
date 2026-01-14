# Guide de Configuration GitHub

Ce guide vous aidera à lier votre projet local à GitHub.

## Étapes pour lier le projet à GitHub

### 1. Créer un dépôt sur GitHub

1. Allez sur [GitHub](https://github.com)
2. Cliquez sur le bouton "+" en haut à droite
3. Sélectionnez "New repository"
4. Nommez-le `cuisine_du_monde` (ou un autre nom de votre choix)
5. Choisissez Public ou Private
6. **Ne cochez pas** "Initialize this repository with a README" (vous avez déjà un README)
7. Cliquez sur "Create repository"

### 2. Lier le dépôt local à GitHub

Exécutez ces commandes dans votre terminal (PowerShell) :

```powershell
# Se placer dans le répertoire du projet
cd "C:\Users\Mathis Bianic\Documents\GitHub\cuisine_du_monde"

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Faire le premier commit
git commit -m "Initial commit: Scraper de restaurants web"

# Ajouter le remote GitHub (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/cuisine_du_monde.git

# Renommer la branche principale en main (si nécessaire)
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

### 3. Vérifier la connexion

Allez sur votre dépôt GitHub et vérifiez que tous les fichiers sont présents.

## Commandes Git utiles

### Ajouter des changements

```powershell
# Voir les fichiers modifiés
git status

# Ajouter tous les fichiers modifiés
git add .

# Ou ajouter un fichier spécifique
git add web_scraper.py

# Faire un commit
git commit -m "Description de vos changements"

# Pousser vers GitHub
git push
```

### Créer une branche

```powershell
# Créer et basculer sur une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire des changements, puis commit et push
git add .
git commit -m "Ajout d'une nouvelle fonctionnalité"
git push -u origin feature/nouvelle-fonctionnalite
```

### Mettre à jour depuis GitHub

```powershell
# Récupérer les dernières modifications
git pull origin main
```

## Fichiers à ne pas commiter

Le fichier `.gitignore` est déjà configuré pour ignorer :
- Les bases de données SQLite (`.db`, `.sqlite`)
- Les fichiers Python compilés (`__pycache__/`, `*.pyc`)
- Les fichiers d'environnement (`.env`)
- Les fichiers de l'IDE (`.vscode/`, `.idea/`)

## Problèmes courants

### Erreur : "remote origin already exists"

Si vous avez déjà un remote, supprimez-le d'abord :
```powershell
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/cuisine_du_monde.git
```

### Erreur : "failed to push some refs"

Si GitHub a un README que vous n'avez pas localement :
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

**Bon développement ! 🚀**
