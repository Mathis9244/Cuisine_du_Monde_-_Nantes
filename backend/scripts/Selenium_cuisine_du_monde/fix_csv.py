"""
Script pour corriger le CSV :
1. Nettoie les adresses (supprime les caractères étranges)
2. Génère des URLs Google Maps au format: https://www.google.com/maps/search/?api=1&query=...
"""
import sqlite3
import csv
import re
from urllib.parse import quote_plus

DB_PATH = "restaurants_maps.sqlite"
CSV_OUTPUT = "restaurants_export_fixed.csv"

def clean_address(address):
    """Nettoie une adresse en supprimant les caractères non imprimables et les retours à la ligne"""
    if not address:
        return None
    
    # Convertir en string si ce n'est pas déjà le cas
    address = str(address)
    
    # Supprimer les caractères de contrôle (retours à la ligne, tabulations, etc.)
    # Garder seulement les caractères imprimables et les espaces
    cleaned = ''.join(char for char in address if char.isprintable() or char.isspace())
    
    # Supprimer les caractères Unicode problématiques (comme \ue0c8)
    cleaned = re.sub(r'[\ue000-\uf8ff]', '', cleaned)  # Supprimer les caractères privés Unicode
    
    # Remplacer les multiples espaces/retours à la ligne par un seul espace
    cleaned = re.sub(r'[\s\n\r\t]+', ' ', cleaned)
    
    # Supprimer les espaces en début et fin
    cleaned = cleaned.strip()
    
    return cleaned if cleaned else None

def generate_google_maps_url(name, address):
    """
    Génère une URL Google Maps au format:
    https://www.google.com/maps/search/?api=1&query=...
    """
    if not name:
        return None
    
    # Construire la requête : nom + adresse si disponible
    if address:
        query = f"{name} {address}"
    else:
        query = name
    
    # Encoder l'URL
    encoded_query = quote_plus(query)
    url = f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
    
    return url

def fix_database():
    """Nettoie les adresses dans la base de données et génère de nouvelles URLs"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Récupérer toutes les données
    cur.execute("""
        SELECT id, cuisine, name, rating, reviews, address, url
        FROM restaurants
        ORDER BY cuisine, rating DESC NULLS LAST
    """)
    
    rows = cur.fetchall()
    
    print(f"[INFO] Traitement de {len(rows)} restaurants...")
    
    updated_count = 0
    for row_id, cuisine, name, rating, reviews, address, old_url in rows:
        # Nettoyer l'adresse
        cleaned_address = clean_address(address)
        
        # Générer la nouvelle URL
        new_url = generate_google_maps_url(name, cleaned_address)
        
        # Mettre à jour la base de données
        cur.execute("""
            UPDATE restaurants
            SET address = ?, url = ?
            WHERE id = ?
        """, (cleaned_address, new_url, row_id))
        
        if cleaned_address != address or new_url != old_url:
            updated_count += 1
            print(f"  [UPDATE] {name}")
            if cleaned_address != address:
                # Afficher l'adresse nettoyée seulement (éviter les problèmes d'encodage)
                try:
                    addr_preview = address[:50] if address else "None"
                except:
                    addr_preview = "[caracteres non affichables]"
                print(f"    Adresse nettoyee: '{cleaned_address}'")
            if new_url != old_url:
                print(f"    Nouvelle URL generee")
    
    conn.commit()
    conn.close()
    
    print(f"\n[OK] {updated_count} restaurants mis a jour")

def export_fixed_csv():
    """Exporte le CSV avec les données nettoyées"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT cuisine, name, rating, reviews, address, url
        FROM restaurants
        ORDER BY cuisine, rating DESC NULLS LAST
    """)
    
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        print(f"[ATTENTION] Aucune donnee a exporter")
        return
    
    # Écrire le CSV
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f, delimiter=';')
        # En-têtes
        writer.writerow(['Cuisine', 'Nom', 'Note', 'Avis', 'Adresse', 'URL'])
        # Données
        for row in rows:
            writer.writerow(row)
    
    print(f"[OK] CSV corrige cree: {CSV_OUTPUT} ({len(rows)} restaurants)")

def main():
    print("=" * 60)
    print("CORRECTION DU CSV")
    print("=" * 60)
    print()
    
    print("[ETAPE 1] Nettoyage des adresses et generation des URLs...")
    fix_database()
    
    print("\n[ETAPE 2] Export du CSV corrige...")
    export_fixed_csv()
    
    print("\n" + "=" * 60)
    print("TERMINE")
    print("=" * 60)
    print(f"\n[INFO] Fichier cree: {CSV_OUTPUT}")
    print("[INFO] Les URLs sont au format: https://www.google.com/maps/search/?api=1&query=...")
    print("[INFO] Les adresses ont ete nettoyees (caracteres etranges supprimes)")

if __name__ == "__main__":
    main()
