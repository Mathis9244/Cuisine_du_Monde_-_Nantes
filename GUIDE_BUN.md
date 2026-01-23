# 🚀 Guide Rapide - Bun

## ✅ Installation de Bun

### Windows (PowerShell)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Linux & macOS

```bash
curl -fsSL https://bun.sh/install | bash
```

### Vérifier l'installation

```bash
bun --version
```

## 📖 Utilisation

### Export CSV des restaurants

```bash
bun src/index.ts
```

Cela va :
- ✅ Récupérer les restaurants depuis OpenStreetMap
- ✅ Exclure automatiquement les restaurants français
- ✅ Générer un CSV avec le format : nom, typedecuisine, adresse, ville, lien_google_maps, phone

### Avec options

```bash
# Nom de fichier personnalisé
bun src/index.ts 1 "" restaurants_nantes.csv

# Filtrer par cuisine
bun src/index.ts 1 italian
```

## 🎯 Avantages de Bun

- ⚡ **3x plus rapide** que Node.js
- 🔥 **Fetch natif** - Pas besoin de bibliothèque externe
- 💾 **SQLite intégré** - Base de données incluse
- 📦 **Pas de node_modules** - Tout est intégré
- 🎯 **TypeScript natif** - Pas de configuration

## 📊 Format du CSV

Le CSV généré contient :

1. **nom** - Nom du restaurant
2. **typedecuisine** - Pays (Chine, Japon, Italie, etc.)
3. **adresse** - Adresse complète
4. **ville** - Nantes
5. **lien_google_maps** - Lien cliquable vers Google Maps
6. **phone** - Numéro de téléphone

## 🔧 Structure

```
src/
  └── index.ts    # Code principal TypeScript
package.json      # Configuration Bun
```

## 💡 Commandes utiles

```bash
# Exécuter le script
bun src/index.ts

# Vérifier la syntaxe TypeScript
bun --check src/index.ts

# Voir l'aide
bun --help
```

---

**Bon projet avec Bun ! 🚀**
