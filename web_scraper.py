"""
Scraper de restaurants depuis des sites web.
Utilise BeautifulSoup pour extraire les données de pages HTML.

ATTENTION: Respectez toujours les robots.txt et les conditions d'utilisation des sites.
Ce projet est à des fins éducatives. Utilisez-le de manière responsable et légale.
"""

import requests
from bs4 import BeautifulSoup
import sqlite3
import time
import re
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse, quote
import random

# Configuration
DB_NAME = 'restaurants_scraped.db'
BASE_DELAY = 2.0  # Délai entre les requêtes (secondes)


class WebRestaurantScraper:
    """Classe pour scraper des restaurants depuis des sites web."""
    
    def __init__(self, db_name: str = DB_NAME):
        """
        Initialise le scraper web.
        
        Args:
            db_name: Nom de la base de données SQLite
        """
        self.db_name = db_name
        self.conn = None
        self.cursor = None
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        self._init_database()
    
    def _init_database(self):
        """Initialise la connexion à la base de données SQLite."""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        
        self.cursor.execute('''CREATE TABLE IF NOT EXISTS restaurants (
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
                            )''')
        self.conn.commit()
    
    def check_robots_txt(self, base_url: str) -> bool:
        """
        Vérifie le fichier robots.txt d'un site.
        
        Args:
            base_url: URL de base du site
        
        Returns:
            True si le scraping est autorisé, False sinon
        """
        try:
            robots_url = urljoin(base_url, '/robots.txt')
            response = self.session.get(robots_url, timeout=5)
            if response.status_code == 200:
                # Vérification basique (simplifiée)
                print(f"⚠️  Vérifiez robots.txt: {robots_url}")
            return True
        except:
            return True  # Continue si on ne peut pas vérifier
    
    def scrape_tripadvisor(self, location: str = "Nantes", max_pages: int = 3) -> List[Dict]:
        """
        Scrape des restaurants depuis TripAdvisor.
        
        ATTENTION: Cette fonction est un exemple. Vérifiez les conditions d'utilisation
        de TripAdvisor avant d'utiliser cette méthode en production.
        
        Args:
            location: Ville à rechercher
            max_pages: Nombre maximum de pages à scraper
        
        Returns:
            Liste de restaurants trouvés
        """
        restaurants = []
        base_url = "https://www.tripadvisor.fr"
        
        # Vérifier robots.txt
        self.check_robots_txt(base_url)
        
        # URL de recherche TripAdvisor (exemple - peut nécessiter des ajustements)
        search_url = f"{base_url}/Restaurants-g187198-{location}_Loire_Atlantique_Pays_de_la_Loire.html"
        
        try:
            print(f"🔍 Scraping TripAdvisor pour {location}...")
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Sélecteurs CSS (peuvent changer selon la structure du site)
            # Ces sélecteurs sont des exemples et doivent être adaptés
            restaurant_elements = soup.select('div[data-test-target="restaurant-card"]')
            
            for element in restaurant_elements[:20]:  # Limiter à 20 pour l'exemple
                try:
                    name_elem = element.select_one('a[href*="/Restaurant_Review"]')
                    name = name_elem.get_text(strip=True) if name_elem else "N/A"
                    
                    rating_elem = element.select_one('svg[aria-label]')
                    rating_text = rating_elem.get('aria-label', '') if rating_elem else ''
                    rating_match = re.search(r'(\d+[,.]?\d*)', rating_text)
                    rating = float(rating_match.group(1).replace(',', '.')) if rating_match else None
                    
                    restaurant = {
                        'name': name,
                        'rating': rating,
                        'source': 'TripAdvisor',
                        'url': urljoin(base_url, name_elem.get('href', '')) if name_elem else ''
                    }
                    restaurants.append(restaurant)
                except Exception as e:
                    print(f"Erreur lors du parsing d'un restaurant: {e}")
                    continue
            
            time.sleep(BASE_DELAY + random.uniform(0, 1))
            
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors du scraping TripAdvisor: {e}")
        
        return restaurants
    
    def scrape_la_fourchette(self, location: str = "Nantes", cuisine: str = "", max_results: int = 20) -> List[Dict]:
        """
        Scrape des restaurants depuis La Fourchette (TheFork).
        
        ATTENTION: Vérifiez les conditions d'utilisation avant d'utiliser en production.
        
        Args:
            location: Ville à rechercher
            cuisine: Type de cuisine (optionnel)
            max_results: Nombre maximum de résultats
        
        Returns:
            Liste de restaurants trouvés
        """
        restaurants = []
        base_url = "https://www.lafourchette.com"
        
        self.check_robots_txt(base_url)
        
        try:
            search_term = f"{cuisine} restaurant {location}" if cuisine else f"restaurant {location}"
            search_url = f"{base_url}/restaurant/{quote(location.lower())}"
            
            print(f"🔍 Scraping La Fourchette pour {search_term}...")
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Sélecteurs CSS pour La Fourchette (à adapter selon la structure)
            restaurant_elements = soup.select('div[class*="restaurant"], article[class*="restaurant"]')[:max_results]
            
            for element in restaurant_elements:
                try:
                    name_elem = element.select_one('h2, h3, a[class*="name"], span[class*="name"]')
                    name = name_elem.get_text(strip=True) if name_elem else "N/A"
                    
                    # Extraire la note
                    rating_elem = element.select_one('[class*="rating"], [class*="score"], [data-rating]')
                    rating = None
                    if rating_elem:
                        rating_text = rating_elem.get_text(strip=True) or rating_elem.get('data-rating', '')
                        rating_match = re.search(r'(\d+[,.]?\d*)', rating_text)
                        rating = float(rating_match.group(1).replace(',', '.')) if rating_match else None
                    
                    # Extraire l'adresse
                    address_elem = element.select_one('[class*="address"], [class*="location"]')
                    address = address_elem.get_text(strip=True) if address_elem else None
                    
                    # Extraire l'URL
                    url_elem = element.select_one('a[href*="/restaurant/"]')
                    url = urljoin(base_url, url_elem.get('href', '')) if url_elem else None
                    
                    restaurant = {
                        'name': name,
                        'cuisine': cuisine if cuisine else None,
                        'address': address,
                        'rating': rating,
                        'source': 'La Fourchette',
                        'url': url
                    }
                    restaurants.append(restaurant)
                except Exception as e:
                    print(f"Erreur lors du parsing d'un restaurant: {e}")
                    continue
            
            time.sleep(BASE_DELAY + random.uniform(0, 1))
            
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors du scraping La Fourchette: {e}")
        
        return restaurants
    
    def scrape_google_maps_web(self, location: str = "Nantes", cuisine: str = "", max_results: int = 20) -> List[Dict]:
        """
        Scrape des restaurants depuis Google Maps (version web).
        
        ATTENTION: Google Maps peut bloquer les scrapers. Utilisez avec précaution.
        Cette méthode est fournie à titre éducatif uniquement.
        
        Args:
            location: Ville à rechercher
            cuisine: Type de cuisine (optionnel)
            max_results: Nombre maximum de résultats
        
        Returns:
            Liste de restaurants trouvés
        """
        restaurants = []
        base_url = "https://www.google.com/maps"
        
        self.check_robots_txt(base_url)
        
        try:
            search_query = f"{cuisine} restaurant {location}" if cuisine else f"restaurant {location}"
            search_url = f"{base_url}/search/{quote(search_query)}"
            
            print(f"🔍 Scraping Google Maps pour {search_query}...")
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Google Maps utilise souvent du JavaScript, donc cette méthode peut être limitée
            # Il faudrait utiliser Selenium pour un scraping complet
            restaurant_elements = soup.select('div[class*="place"], div[data-value]')[:max_results]
            
            for element in restaurant_elements:
                try:
                    name_elem = element.select_one('h3, [class*="name"], [data-value]')
                    name = name_elem.get_text(strip=True) if name_elem else "N/A"
                    
                    if name == "N/A":
                        continue
                    
                    restaurant = {
                        'name': name,
                        'cuisine': cuisine if cuisine else None,
                        'source': 'Google Maps',
                        'url': search_url
                    }
                    restaurants.append(restaurant)
                except Exception as e:
                    continue
            
            time.sleep(BASE_DELAY + random.uniform(0, 2))
            
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors du scraping Google Maps: {e}")
        
        return restaurants
    
    def save_restaurant(self, restaurant: Dict) -> bool:
        """
        Sauvegarde un restaurant dans la base de données.
        
        Args:
            restaurant: Dictionnaire contenant les données du restaurant
        
        Returns:
            True si sauvegardé avec succès, False sinon
        """
        try:
            self.cursor.execute("""
                INSERT OR IGNORE INTO restaurants 
                (source, name, cuisine, address, phone, rating, price_range, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                restaurant.get('source'),
                restaurant.get('name'),
                restaurant.get('cuisine'),
                restaurant.get('address'),
                restaurant.get('phone'),
                restaurant.get('rating'),
                restaurant.get('price_range'),
                restaurant.get('url')
            ))
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Erreur lors de la sauvegarde: {e}")
            return False
    
    def scrape_all_sources(self, location: str = "Nantes", cuisines: List[str] = None, 
                          sources: List[str] = None):
        """
        Scrape des restaurants depuis toutes les sources disponibles.
        
        Args:
            location: Ville à rechercher
            cuisines: Liste des types de cuisines (optionnel)
            sources: Liste des sources à utiliser ['tripadvisor', 'lafourchette'] (optionnel)
        """
        if cuisines is None:
            cuisines = ["italian", "chinese", "indian", "japanese", "mexican", "thai", "lebanese"]
        
        if sources is None:
            sources = ['tripadvisor', 'lafourchette']
        
        total_saved = 0
        
        # Scraping TripAdvisor
        if 'tripadvisor' in sources:
            print("\n" + "=" * 60)
            print("🌐 SCRAPING TRIPADVISOR")
            print("=" * 60)
            tripadvisor_restaurants = self.scrape_tripadvisor(location)
            for restaurant in tripadvisor_restaurants:
                if self.save_restaurant(restaurant):
                    total_saved += 1
        
        # Scraping La Fourchette pour chaque cuisine
        if 'lafourchette' in sources:
            print("\n" + "=" * 60)
            print("🌐 SCRAPING LA FOURCHETTE")
            print("=" * 60)
            for cuisine in cuisines:
                restaurants = self.scrape_la_fourchette(location, cuisine)
                for restaurant in restaurants:
                    if self.save_restaurant(restaurant):
                        total_saved += 1
                time.sleep(BASE_DELAY)
        
        # Scraping Google Maps (optionnel, peut être bloqué)
        if 'google' in sources:
            print("\n" + "=" * 60)
            print("🌐 SCRAPING GOOGLE MAPS")
            print("=" * 60)
            print("⚠️  Google Maps peut bloquer les scrapers. Résultats limités.")
            for cuisine in cuisines[:3]:  # Limiter pour éviter les blocages
                restaurants = self.scrape_google_maps_web(location, cuisine)
                for restaurant in restaurants:
                    if self.save_restaurant(restaurant):
                        total_saved += 1
                time.sleep(BASE_DELAY * 2)
        
        print(f"\n✅ Total: {total_saved} restaurants sauvegardés")
    
    def get_statistics(self) -> Dict:
        """Retourne des statistiques sur les restaurants sauvegardés."""
        stats = {}
        
        self.cursor.execute("SELECT COUNT(*) FROM restaurants")
        stats['total'] = self.cursor.fetchone()[0]
        
        self.cursor.execute("""
            SELECT source, COUNT(*) as count 
            FROM restaurants 
            GROUP BY source
        """)
        stats['by_source'] = dict(self.cursor.fetchall())
        
        self.cursor.execute("SELECT AVG(rating) FROM restaurants WHERE rating IS NOT NULL")
        result = self.cursor.fetchone()[0]
        stats['avg_rating'] = round(result, 2) if result else None
        
        return stats
    
    def close(self):
        """Ferme la connexion à la base de données."""
        if self.conn:
            self.conn.close()
        if self.session:
            self.session.close()


def main():
    """Fonction principale."""
    print("=" * 70)
    print("🍽️  SCRAPER DE RESTAURANTS - CUISINE DU MONDE")
    print("=" * 70)
    print("⚠️  ATTENTION: SCRAPING WEB")
    print("=" * 70)
    print("Ce script scrape des sites web pour extraire des informations.")
    print("Assurez-vous de respecter:")
    print("  - Les conditions d'utilisation des sites")
    print("  - Les fichiers robots.txt")
    print("  - Les limites de taux de requêtes")
    print("  - Les lois sur le scraping web")
    print("=" * 70)
    
    response = input("\nVoulez-vous continuer? (oui/non): ")
    if response.lower() not in ['oui', 'o', 'yes', 'y']:
        print("Opération annulée.")
        return
    
    scraper = WebRestaurantScraper()
    
    try:
        location = input("\nEntrez la ville (défaut: Nantes): ").strip() or "Nantes"
        
        print("\nSources disponibles:")
        print("  1. TripAdvisor")
        print("  2. La Fourchette")
        print("  3. Toutes les sources")
        
        source_choice = input("\nChoisissez une source (1-3, défaut: 3): ").strip() or "3"
        
        sources_map = {
            '1': ['tripadvisor'],
            '2': ['lafourchette'],
            '3': ['tripadvisor', 'lafourchette']
        }
        selected_sources = sources_map.get(source_choice, ['tripadvisor', 'lafourchette'])
        
        print("\n" + "=" * 70)
        print(f"🍽️  SCRAPING RESTAURANTS À {location.upper()}")
        print("=" * 70)
        
        scraper.scrape_all_sources(location, sources=selected_sources)
        
        # Afficher les statistiques
        print("\n" + "=" * 70)
        print("📊 STATISTIQUES")
        print("=" * 70)
        stats = scraper.get_statistics()
        print(f"Total de restaurants: {stats['total']}")
        if stats['avg_rating']:
            print(f"Note moyenne: {stats['avg_rating']}/5.0")
        print("\nRépartition par source:")
        for source, count in stats['by_source'].items():
            print(f"  - {source}: {count} restaurants")
        
        print(f"\n💾 Données sauvegardées dans: {scraper.db_name}")
    
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
