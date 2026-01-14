# 🍽️ Cuisine du Monde - Scraper de Restaurants

Scraper web gratuit et open-source pour récupérer des informations sur les restaurants étrangers depuis différents sites web.

## 📋 Description

Ce projet permet de scraper des informations sur les restaurants depuis plusieurs sources web :
- **TripAdvisor** - Annuaire de restaurants avec avis
- **La Fourchette** - Plateforme de réservation de restaurants
- **Google Maps** (expérimental) - Recherche de restaurants

Les données sont stockées dans une base de données SQLite locale et peuvent être exportées en CSV ou JSON.

## ⚠️ Avertissement Important

Ce projet est fourni à des fins **éducatives et de recherche**. Avant d'utiliser ce scraper :

- ✅ Respectez les fichiers `robots.txt` de chaque site
- ✅ Vérifiez les conditions d'utilisation de chaque site web
- ✅ N'utilisez pas ce scraper à des fins commerciales sans autorisation
- ✅ Respectez les limites de taux de requêtes (délais entre requêtes)
- ✅ Respectez les lois sur le scraping web de votre pays
- ✅ Utilisez les données de manière éthique et légale

## 🚀 Installation

### Prérequis

- Python 3.7 ou supérieur
- pip (gestionnaire de paquets Python)

### Étapes d'installation

1. **Cloner le projet** :
```bash
git clone https://github.com/VOTRE_USERNAME/cuisine_du_monde.git
cd cuisine_du_monde
```

2. **Installer les dépendances** :
```bash
pip install -r requirements.txt
```

## 📖 Utilisation

### Utilisation en ligne de commande

Lancez le scraper avec :

```bash
python web_scraper.py
```

Le script vous guidera pour :
- Choisir la ville à scraper
- Sélectionner les sources (TripAdvisor, La Fourchette, ou toutes)
- Afficher les statistiques des données récupérées

### Utilisation programmatique

```python
from web_scraper import WebRestaurantScraper

# Créer une instance du scraper
scraper = WebRestaurantScraper(db_name='mes_restaurants.db')

try:
    # Scraper depuis TripAdvisor
    restaurants = scraper.scrape_tripadvisor(location="Nantes", max_pages=2)
    
    # Sauvegarder les restaurants
    for restaurant in restaurants:
        scraper.save_restaurant(restaurant)
    
    # Afficher les statistiques
    stats = scraper.get_statistics()
    print(f"Total: {stats['total']} restaurants")
    
finally:
    scraper.close()
```

Voir `example_usage.py` pour plus d'exemples.

### Visualiser et Exporter les Données

Utilisez le script `view_data.py` pour visualiser et exporter vos données :

```bash
python view_data.py
```

**Fonctionnalités** :
- 📊 Statistiques détaillées (par cuisine, note moyenne, etc.)
- 📋 Affichage des restaurants avec filtres
- 💾 Export en CSV ou JSON
- 🔍 Recherche par type de cuisine

## 📊 Base de données

Les restaurants sont stockés dans une base de données SQLite : `restaurants_scraped.db`

### Structure de la table

```sql
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    name TEXT NOT NULL,
    cuisine TEXT,
    address TEXT,
    phone TEXT,
    rating REAL,
    price_range TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Interroger la base de données

**Option 1 : Utiliser le script de visualisation** (recommandé)

```bash
python view_data.py
```

**Option 2 : Utiliser SQLite directement**

```bash
sqlite3 restaurants_scraped.db
```

Exemples de requêtes SQL :

```sql
-- Tous les restaurants
SELECT * FROM restaurants;

-- Restaurants par source
SELECT source, COUNT(*) FROM restaurants GROUP BY source;

-- Top 10 restaurants par note
SELECT name, cuisine, rating FROM restaurants 
ORDER BY rating DESC LIMIT 10;

-- Restaurants italiens avec note > 4.0
SELECT name, address, rating FROM restaurants 
WHERE cuisine = 'italian' AND rating > 4.0;
```

## 🔧 Configuration

### Modifier la localisation

Dans `web_scraper.py`, modifiez la variable par défaut ou passez-la en paramètre :

```python
scraper.scrape_tripadvisor(location="Paris")
```

### Modifier les types de cuisines

```python
cuisines = ["italian", "chinese", "indian", "japanese", "mexican", "thai"]
scraper.scrape_all_sources(location="Nantes", cuisines=cuisines)
```

### Ajuster les délais entre requêtes

Dans `web_scraper.py` :

```python
BASE_DELAY = 2.0  # Secondes entre les requêtes (augmentez pour être plus respectueux)
```

## 📝 Limitations

- **Structure des sites** : Les sites web peuvent changer leur structure HTML, nécessitant des mises à jour des sélecteurs CSS
- **Blocages potentiels** : Certains sites peuvent bloquer les scrapers (CAPTCHA, IP ban, etc.)
- **JavaScript** : Les sites utilisant beaucoup de JavaScript peuvent nécessiter Selenium au lieu de BeautifulSoup
- **Lenteur** : Le scraping web est plus lent qu'une API (délais entre requêtes)

## 🛠️ Développement

### Structure du projet

```
cuisine_du_monde/
├── web_scraper.py      # Script principal de scraping
├── view_data.py         # Visualisation et export des données
├── example_usage.py     # Exemples d'utilisation
├── requirements.txt     # Dépendances Python
├── README.md           # Documentation
└── .gitignore          # Fichiers à ignorer par Git
```

### Ajouter une nouvelle source

Pour ajouter une nouvelle source de scraping :

1. Créez une nouvelle méthode dans `WebRestaurantScraper` :
```python
def scrape_nouvelle_source(self, location: str, **kwargs) -> List[Dict]:
    # Votre code de scraping ici
    pass
```

2. Ajoutez-la dans `scrape_all_sources()` si nécessaire

3. Documentez la méthode avec les avertissements appropriés

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

- 🐛 Signaler des bugs
- 💡 Proposer des améliorations
- ➕ Ajouter de nouvelles sources de données
- 📝 Améliorer la documentation
- 🧪 Ajouter des tests

### Comment contribuer

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## ⚖️ Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :

1. Vérifiez que toutes les dépendances sont installées
2. Consultez les issues existantes sur GitHub
3. Créez une nouvelle issue si nécessaire

## 🎯 Roadmap

- [ ] Ajouter plus de sources (Zomato, OpenTable, etc.)
- [ ] Support pour Selenium pour les sites JavaScript
- [ ] Interface web pour visualiser les données
- [ ] API REST pour accéder aux données
- [ ] Export vers d'autres formats (Excel, PostgreSQL, etc.)
- [ ] Système de cache pour éviter les re-scraping
- [ ] Tests automatisés

## 🙏 Remerciements

- BeautifulSoup pour le parsing HTML
- Requests pour les requêtes HTTP
- La communauté open-source Python

---

**Bon scraping ! 🍜🍕🍣**

*Rappelez-vous : Utilisez ce projet de manière responsable et respectueuse.*
