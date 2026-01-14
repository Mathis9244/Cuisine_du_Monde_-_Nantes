"""
Exemple d'utilisation programmatique du scraper web.
Ce fichier montre comment utiliser la classe WebRestaurantScraper dans vos propres scripts.
"""

from web_scraper import WebRestaurantScraper


def example_basic_scraping():
    """Exemple d'utilisation basique du scraper."""
    print("=" * 60)
    print("EXEMPLE: Scraping basique")
    print("=" * 60)
    
    scraper = WebRestaurantScraper(db_name='example_basic.db')
    
    try:
        # Scraper depuis une seule source
        print("\n🔍 Scraping TripAdvisor pour Nantes...")
        restaurants = scraper.scrape_tripadvisor(location="Nantes", max_pages=1)
        
        print(f"✅ {len(restaurants)} restaurants trouvés")
        for restaurant in restaurants[:5]:  # Afficher les 5 premiers
            print(f"  - {restaurant.get('name')}")
            if restaurant.get('rating'):
                print(f"    Note: {restaurant.get('rating')}/5.0")
            if restaurant.get('url'):
                print(f"    URL: {restaurant.get('url')}")
    
    finally:
        scraper.close()


def example_custom_cuisines():
    """Exemple de scraping avec des cuisines personnalisées."""
    print("\n" + "=" * 60)
    print("EXEMPLE: Scraping avec cuisines personnalisées")
    print("=" * 60)
    
    scraper = WebRestaurantScraper(db_name='example_cuisines.db')
    
    try:
        # Définir des cuisines spécifiques
        cuisines = ["japanese", "korean", "thai"]
        location = "Nantes"
        
        # Scraper depuis La Fourchette pour chaque cuisine
        for cuisine in cuisines:
            print(f"\n🔍 Recherche de restaurants {cuisine}...")
            restaurants = scraper.scrape_la_fourchette(
                location=location,
                cuisine=cuisine,
                max_results=10
            )
            
            print(f"✅ {len(restaurants)} restaurants {cuisine} trouvés")
            
            # Sauvegarder les restaurants
            for restaurant in restaurants:
                if scraper.save_restaurant(restaurant):
                    print(f"  💾 Sauvegardé: {restaurant.get('name')}")
    
    finally:
        scraper.close()


def example_multiple_sources():
    """Exemple de scraping depuis plusieurs sources."""
    print("\n" + "=" * 60)
    print("EXEMPLE: Scraping depuis plusieurs sources")
    print("=" * 60)
    
    scraper = WebRestaurantScraper(db_name='example_multiple.db')
    
    try:
        location = "Nantes"
        cuisines = ["italian", "chinese"]
        
        # Scraper depuis toutes les sources disponibles
        scraper.scrape_all_sources(
            location=location,
            cuisines=cuisines,
            sources=['tripadvisor', 'lafourchette']
        )
        
        # Afficher les statistiques
        stats = scraper.get_statistics()
        print(f"\n📊 Statistiques:")
        print(f"   Total: {stats['total']} restaurants")
        print(f"   Note moyenne: {stats['avg_rating']}")
        print("\n   Répartition par source:")
        for source, count in stats['by_source'].items():
            print(f"     - {source}: {count}")
    
    finally:
        scraper.close()


def example_data_analysis():
    """Exemple d'analyse des données scrapées."""
    print("\n" + "=" * 60)
    print("EXEMPLE: Analyse des données")
    print("=" * 60)
    
    import sqlite3
    import os
    
    # Se connecter à une base de données existante
    db_path = 'restaurants_scraped.db'
    if not os.path.exists(db_path):
        print(f"⚠️  Base de données {db_path} non trouvée")
        print("   Exécutez d'abord web_scraper.py pour créer des données")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Analyse 1: Top 5 sources
        print("\n📊 Top 5 sources:")
        cursor.execute("""
            SELECT source, COUNT(*) as count 
            FROM restaurants 
            WHERE source IS NOT NULL
            GROUP BY source 
            ORDER BY count DESC 
            LIMIT 5
        """)
        for source, count in cursor.fetchall():
            print(f"   {source}: {count} restaurants")
        
        # Analyse 2: Restaurants avec les meilleures notes
        print("\n⭐ Top 5 restaurants (par note):")
        cursor.execute("""
            SELECT name, cuisine, rating, source, address 
            FROM restaurants 
            WHERE rating IS NOT NULL
            ORDER BY rating DESC 
            LIMIT 5
        """)
        for i, (name, cuisine, rating, source, address) in enumerate(cursor.fetchall(), 1):
            print(f"   {i}. {name}")
            if cuisine:
                print(f"      Type: {cuisine}")
            print(f"      Note: {rating}/5.0")
            print(f"      Source: {source}")
            if address:
                print(f"      📍 {address}")
        
        # Analyse 3: Répartition par cuisine
        print("\n🍽️  Répartition par type de cuisine:")
        cursor.execute("""
            SELECT cuisine, COUNT(*) as count
            FROM restaurants 
            WHERE cuisine IS NOT NULL
            GROUP BY cuisine 
            ORDER BY count DESC
        """)
        for cuisine, count in cursor.fetchall():
            print(f"   {cuisine}: {count} restaurants")
    
    finally:
        conn.close()


if __name__ == "__main__":
    print("🍽️  EXEMPLES D'UTILISATION DU SCRAPER WEB")
    print("=" * 60)
    
    # Décommenter les exemples que vous voulez exécuter
    
    # Exemple 1: Scraping basique
    # example_basic_scraping()
    
    # Exemple 2: Scraping avec cuisines personnalisées
    # example_custom_cuisines()
    
    # Exemple 3: Scraping depuis plusieurs sources
    # example_multiple_sources()
    
    # Exemple 4: Analyse des données existantes
    example_data_analysis()
    
    print("\n" + "=" * 60)
    print("✅ Exemples terminés!")
    print("=" * 60)
    print("\n💡 Astuce: Décommentez les fonctions dans le script pour les tester")
