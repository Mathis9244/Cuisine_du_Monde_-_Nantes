"""
Script pour migrer les données de la table PostgreSQL existante vers Django
"""
import os
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'restaurants_api.settings')
django.setup()

from restaurants.models import Restaurant
import psycopg2
from urllib.parse import urlparse

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_rOsE5P9lmboy@ep-broad-salad-ah35l2lr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
)

def migrate_data():
    """Migre les données de la table PostgreSQL vers Django"""
    print("=" * 60)
    print("MIGRATION DES DONNEES")
    print("=" * 60)
    print()
    
    # Connexion à PostgreSQL
    result = urlparse(DATABASE_URL)
    conn = psycopg2.connect(
        database=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port or 5432,
        sslmode='require'
    )
    cur = conn.cursor()
    
    # Vérifier si la table existe
    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'restaurants'
        )
    """)
    
    if not cur.fetchone()[0]:
        print("[ERREUR] La table 'restaurants' n'existe pas dans PostgreSQL")
        print("         Lance d'abord le script de scraping pour créer les données.")
        return
    
    # Récupérer les données
    cur.execute("""
        SELECT cuisine, name, rating, reviews, address, url
        FROM restaurants
    """)
    
    rows = cur.fetchall()
    conn.close()
    
    print(f"[INFO] {len(rows)} restaurants trouves dans PostgreSQL")
    print()
    
    # Migrer vers Django
    created = 0
    updated = 0
    errors = 0
    
    for cuisine, name, rating, reviews, address, url in rows:
        try:
            # Tronquer les champs si nécessaire
            cuisine_trunc = (cuisine or '')[:500]
            name_trunc = (name or '')[:500]
            url_trunc = (url or '')[:1000]
            
            restaurant, was_created = Restaurant.objects.update_or_create(
                url=url_trunc,
                defaults={
                    'cuisine': cuisine_trunc,
                    'name': name_trunc,
                    'rating': rating,
                    'reviews': reviews,
                    'address': address,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        except Exception as e:
            try:
                error_msg = str(e)[:100]
                print(f"[ERREUR] {name[:50] if name else 'N/A'}: {error_msg}")
            except:
                print(f"[ERREUR] Erreur lors de la migration d'un restaurant")
            errors += 1
    
    print()
    print("=" * 60)
    print("MIGRATION TERMINEE")
    print("=" * 60)
    print(f"[OK] {created} restaurants crees")
    print(f"[OK] {updated} restaurants mis a jour")
    if errors > 0:
        print(f"[ERREUR] {errors} erreurs")
    print()
    print(f"[INFO] Total dans Django: {Restaurant.objects.count()} restaurants")

if __name__ == "__main__":
    migrate_data()
