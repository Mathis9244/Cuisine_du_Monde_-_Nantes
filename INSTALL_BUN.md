# 📦 Installation de Bun sur Windows

## Méthode 1 : Installation automatique (PowerShell)

Ouvrez PowerShell en tant qu'administrateur et exécutez :

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Méthode 2 : Installation manuelle

### Étape 1 : Télécharger Bun

1. Allez sur https://bun.sh/
2. Cliquez sur "Install" ou téléchargez directement depuis :
   - https://github.com/oven-sh/bun/releases/latest
   - Téléchargez `bun-windows-x64.zip` pour Windows 64-bit

### Étape 2 : Extraire et installer

1. Extrayez le fichier ZIP
2. Ajoutez le dossier `bun` à votre PATH Windows :
   - Ouvrez "Variables d'environnement" dans Windows
   - Ajoutez le chemin vers le dossier `bun` dans la variable PATH

### Étape 3 : Vérifier l'installation

Ouvrez un nouveau terminal PowerShell et exécutez :

```powershell
bun --version
```

Si cela fonctionne, Bun est installé ! ✅

## Méthode 3 : Utiliser npm (si Node.js est installé)

Si vous avez Node.js installé, vous pouvez installer Bun via npm :

```bash
npm install -g bun
```

## Vérification

Une fois installé, vérifiez que tout fonctionne :

```powershell
bun --version
```

Vous devriez voir quelque chose comme : `bun 1.x.x`

## Utilisation

Une fois Bun installé, vous pouvez exécuter le projet :

```powershell
bun src/index.ts
```

---

**Note :** Si vous rencontrez des problèmes, consultez la documentation officielle : https://bun.sh/docs/installation
