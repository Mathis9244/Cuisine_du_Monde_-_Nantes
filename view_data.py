"""
Script utilitaire pour visualiser et exporter les données des restaurants.
"""

import sqlite3
import sys
import json
import csv
from pathlib import Path
from typing import Optional


def connect_db(db_path: str) -> Optional[sqlite3.Connection]:
    """Connecte à la base de données."""
    try:
        conn = sqlite3.connect(db_path)
        return conn
    except sqlite3.Error as e:
        print(f"❌ Erreur lors de la connexion à la base de données: {e}")
        return None


def list_databases():
    """Liste les bases de données disponibles."""
    db_files = list(Path('.').glob('*.db'))
    if not db_files:
        print("⚠️  Aucune base de données trouvée dans le répertoire actuel.")
        return []
    return [str(db) for db in db_files]


def show_statistics(conn: sqlite3.Connection):
    """Affiche les statistiques de la base de données."""
    cursor = conn.cursor()
    
    # Nombre total
    cursor.execute("SELECT COUNT(*) FROM restaurants")
    total = cursor.fetchone()[0]
    print(f"\n📊 Total de restaurants: {total}")
    
    # Par cuisine
    cursor.execute("""
        SELECT cuisine, COUNT(*) as count 
        FROM restaurants 
        WHERE cuisine IS NOT NULL
        GROUP BY cuisine 
        ORDER BY count DESC
    """)
    print("\n🍽️  Répartition par type de cuisine:")
    for cuisine, count in cursor.fetchall():
        print(f"   {cuisine:20} : {count:3} restaurants")
    
    # Note moyenne
    cursor.execute("SELECT AVG(rating) FROM restaurants WHERE rating IS NOT NULL")
    avg_rating = cursor.fetchone()[0]
    if avg_rating:
        print(f"\n⭐ Note moyenne: {avg_rating:.2f}/5.0")
    
    # Par source (si disponible)
    try:
        cursor.execute("""
            SELECT source, COUNT(*) as count 
            FROM restaurants 
            WHERE source IS NOT NULL
            GROUP BY source
        """)
        sources = cursor.fetchall()
        if sources:
            print("\n🌐 Répartition par source:")
            for source, count in sources:
                print(f"   {source:20} : {count:3} restaurants")
    except sqlite3.OperationalError:
        pass  # La colonne source n'existe peut-être pas


def show_restaurants(conn: sqlite3.Connection, limit: int = 10, cuisine: Optional[str] = None):
    """Affiche une liste de restaurants."""
    cursor = conn.cursor()
    
    query = "SELECT name, cuisine, address, rating, phone FROM restaurants WHERE 1=1"
    params = []
    
    if cuisine:
        query += " AND cuisine = ?"
        params.append(cuisine)
    
    query += " ORDER BY rating DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    restaurants = cursor.fetchall()
    
    if not restaurants:
        print(f"\n⚠️  Aucun restaurant trouvé{f' pour la cuisine {cuisine}' if cuisine else ''}.")
        return
    
    print(f"\n📋 Top {len(restaurants)} restaurants{f' ({cuisine})' if cuisine else ''}:")
    print("=" * 80)
    
    for i, (name, cuisine_type, address, rating, phone) in enumerate(restaurants, 1):
        print(f"\n{i}. {name}")
        if cuisine_type:
            print(f"   Type: {cuisine_type}")
        if address:
            print(f"   📍 {address}")
        if rating:
            print(f"   ⭐ {rating}/5.0")
        if phone:
            print(f"   📞 {phone}")


def export_to_csv(conn: sqlite3.Connection, output_file: str):
    """Exporte les données vers un fichier CSV."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM restaurants")
    
    # Récupérer les noms de colonnes
    column_names = [description[0] for description in cursor.description]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(column_names)
        writer.writerows(cursor.fetchall())
    
    print(f"✅ Données exportées vers {output_file}")


def export_to_json(conn: sqlite3.Connection, output_file: str):
    """Exporte les données vers un fichier JSON."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM restaurants")
    
    column_names = [description[0] for description in cursor.description]
    rows = cursor.fetchall()
    
    data = []
    for row in rows:
        restaurant = dict(zip(column_names, row))
        # Convertir les types pour JSON
        for key, value in restaurant.items():
            if isinstance(value, float):
                restaurant[key] = value
            elif value is None:
                restaurant[key] = None
        data.append(restaurant)
    
    with open(output_file, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, ensure_ascii=False, indent=2)
    
    print(f"✅ Données exportées vers {output_file}")


def main():
    """Fonction principale."""
    print("=" * 80)
    print("🍽️  VISUALISEUR DE DONNÉES - RESTAURANTS")
    print("=" * 80)
    
    # Lister les bases de données disponibles
    databases = list_databases()
    if not databases:
        return
    
    if len(databases) == 1:
        db_path = databases[0]
        print(f"\n📁 Base de données trouvée: {db_path}")
    else:
        print("\n📁 Bases de données disponibles:")
        for i, db in enumerate(databases, 1):
            print(f"   {i}. {db}")
        
        choice = input("\nChoisissez une base de données (numéro): ").strip()
        try:
            db_path = databases[int(choice) - 1]
        except (ValueError, IndexError):
            print("❌ Choix invalide.")
            return
    
    # Se connecter à la base de données
    conn = connect_db(db_path)
    if not conn:
        return
    
    try:
        while True:
            print("\n" + "=" * 80)
            print("MENU:")
            print("  1. Afficher les statistiques")
            print("  2. Afficher les restaurants (top 10)")
            print("  3. Filtrer par type de cuisine")
            print("  4. Exporter en CSV")
            print("  5. Exporter en JSON")
            print("  0. Quitter")
            print("=" * 80)
            
            choice = input("\nVotre choix: ").strip()
            
            if choice == '1':
                show_statistics(conn)
            elif choice == '2':
                limit = input("Nombre de restaurants à afficher (défaut: 10): ").strip()
                limit = int(limit) if limit.isdigit() else 10
                show_restaurants(conn, limit=limit)
            elif choice == '3':
                cuisine = input("Type de cuisine à rechercher: ").strip()
                limit = input("Nombre de résultats (défaut: 10): ").strip()
                limit = int(limit) if limit.isdigit() else 10
                show_restaurants(conn, limit=limit, cuisine=cuisine if cuisine else None)
            elif choice == '4':
                output_file = input("Nom du fichier CSV (défaut: restaurants_export.csv): ").strip()
                output_file = output_file if output_file else "restaurants_export.csv"
                export_to_csv(conn, output_file)
            elif choice == '5':
                output_file = input("Nom du fichier JSON (défaut: restaurants_export.json): ").strip()
                output_file = output_file if output_file else "restaurants_export.json"
                export_to_json(conn, output_file)
            elif choice == '0':
                print("\n👋 Au revoir!")
                break
            else:
                print("❌ Choix invalide.")
    
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interruption utilisateur. Au revoir!")
        sys.exit(0)
