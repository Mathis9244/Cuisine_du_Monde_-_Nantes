import time
import csv
import re
import os
from dataclasses import dataclass
from typing import List, Optional, Dict
from urllib.parse import quote_plus
import psycopg2

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# -----------------------------
# CONFIG - PERSONNALISATION RAPIDE
# -----------------------------

# Ville à rechercher
CITY = "Nantes"

# Nombre de restaurants à récupérer par cuisine
TOP_N = 5

# URL de connexion PostgreSQL (Neon)
# Tu peux aussi utiliser une variable d'environnement: DATABASE_URL
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_rOsE5P9lmboy@ep-broad-salad-ah35l2lr-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
)

# Mode headless (sans interface graphique)
# ⚠️ ASTUCE ANTI-CAPTCHA: Si Google te bloque, mets HEADLESS = False
HEADLESS = False

# Pause entre chaque recherche de cuisine (en secondes)
# ⚠️ ASTUCE ANTI-CAPTCHA: Augmente à 3-5 secondes si tu rencontres des captchas
PAUSE_BETWEEN_CUISINES = 3

# -----------------------------
# MAPPING PAYS → CUISINE NORMALISÉ
# -----------------------------
# Dictionnaire pour normaliser les noms de pays vers les libellés de cuisine
# Tu peux utiliser ce mapping pour générer automatiquement CUISINES
PAYS_TO_CUISINE: Dict[str, str] = {
    # Asie
    "Taïwan": "taïwanais",
    "Japon": "japonais",
    "Chine": "chinois",
    "Corée du Sud": "coréen",
    "Corée": "coréen",
    "Thaïlande": "thaïlandais",
    "Vietnam": "vietnamien",
    "Inde": "indien",
    "Indonésie": "indonésien",
    "Malaisie": "malaisien",
    "Singapour": "singapourien",
    "Philippines": "philippin",
    "Sri Lanka": "sri-lankais",
    "Népal": "népalais",
    "Bangladesh": "bengali",
    "Pakistan": "pakistanais",
    "Afghanistan": "afghan",
    "Mongolie": "mongol",
    "Myanmar": "birman",
    "Cambodge": "cambodgien",
    "Laos": "laotien",
    
    # Moyen-Orient
    "Liban": "libanais",
    "Syrie": "syrien",
    "Israël": "israélien",
    "Palestine": "palestinien",
    "Turquie": "turc",
    "Iran": "iranien",
    "Irak": "irakien",
    "Jordanie": "jordanien",
    "Émirats arabes unis": "émirati",
    "Arabie saoudite": "saoudien",
    "Yémen": "yéménite",
    "Oman": "omanais",
    "Koweït": "koweïtien",
    "Qatar": "qatari",
    "Bahreïn": "bahreïni",
    
    # Afrique
    "Éthiopie": "éthiopien",
    "Érythrée": "érythréen",
    "Maroc": "marocain",
    "Tunisie": "tunisien",
    "Algérie": "algérien",
    "Sénégal": "sénégalais",
    "Mali": "malien",
    "Côte d'Ivoire": "ivoirien",
    "Ghana": "ghanéen",
    "Nigeria": "nigérian",
    "Cameroun": "camerounais",
    "Congo": "congolais",
    "Kenya": "kenyan",
    "Tanzanie": "tanzanien",
    "Ouganda": "ougandais",
    "Rwanda": "rwandais",
    "Afrique du Sud": "sud-africain",
    "Madagascar": "malgache",
    "Maurice": "mauricien",
    "Seychelles": "seychellois",
    "Cap-Vert": "cap-verdien",
    "Guinée": "guinéen",
    "Burkina Faso": "burkinabé",
    "Niger": "nigérien",
    "Tchad": "tchadien",
    "Soudan": "soudanais",
    "Égypte": "égyptien",
    "Libye": "libyen",
    
    # Europe
    "Italie": "italien",
    "France": "français",
    "Espagne": "espagnol",
    "Portugal": "portugais",
    "Grèce": "grec",
    "Allemagne": "allemand",
    "Autriche": "autrichien",
    "Suisse": "suisse",
    "Belgique": "belge",
    "Pays-Bas": "néerlandais",
    "Royaume-Uni": "britannique",
    "Irlande": "irlandais",
    "Pologne": "polonais",
    "République tchèque": "tchèque",
    "Hongrie": "hongrois",
    "Roumanie": "roumain",
    "Bulgarie": "bulgare",
    "Croatie": "croate",
    "Serbie": "serbe",
    "Bosnie-Herzégovine": "bosniaque",
    "Albanie": "albanais",
    "Macédoine": "macédonien",
    "Slovénie": "slovène",
    "Slovaquie": "slovaque",
    "Suède": "suédois",
    "Norvège": "norvégien",
    "Danemark": "danois",
    "Finlande": "finlandais",
    "Islande": "islandais",
    "Estonie": "estonien",
    "Lettonie": "letton",
    "Lituanie": "lituanien",
    "Russie": "russe",
    "Ukraine": "ukrainien",
    "Géorgie": "géorgien",
    "Arménie": "arménien",
    "Turquie": "turc",
    
    # Amériques
    "Mexique": "mexicain",
    "États-Unis": "américain",
    "USA": "américain",
    "Canada": "canadien",
    "Brésil": "brésilien",
    "Argentine": "argentin",
    "Chili": "chilien",
    "Pérou": "péruvien",
    "Colombie": "colombien",
    "Venezuela": "vénézuélien",
    "Équateur": "équatorien",
    "Bolivie": "bolivien",
    "Paraguay": "paraguayen",
    "Uruguay": "uruguayen",
    "Cuba": "cubain",
    "Jamaïque": "jamaïcain",
    "Haïti": "haïtien",
    "République dominicaine": "dominicain",
    "Trinité-et-Tobago": "trinidadien",
    "Guyane": "guyanais",
    "Suriname": "surinamais",
    "Guatemala": "guatémaltèque",
    "Honduras": "hondurien",
    "Nicaragua": "nicaraguayen",
    "Costa Rica": "costaricien",
    "Panama": "panaméen",
    "Salvador": "salvadorien",
    "Belize": "bélizien",
    
    # Océanie
    "Australie": "australien",
    "Nouvelle-Zélande": "néo-zélandais",
    "Fidji": "fidjien",
    "Tonga": "tongien",
    "Samoa": "samoan",
    "Papouasie-Nouvelle-Guinée": "papou",
    
    # Autres
    "Guyane française": "guyanais",
    "Réunion": "réunionnais",
    "Martinique": "martiniquais",
    "Guadeloupe": "guadeloupéen",
}

# Fonction utilitaire pour obtenir la cuisine depuis un pays
def get_cuisine_from_country(pays: str) -> Optional[str]:
    """Retourne le libellé de cuisine normalisé pour un pays donné."""
    return PAYS_TO_CUISINE.get(pays)

# Fonction pour générer la liste CUISINES depuis une liste de pays
def generate_cuisines_from_countries(pays_list: List[str]) -> List[str]:
    """Génère une liste de cuisines normalisées depuis une liste de pays."""
    cuisines = []
    for pays in pays_list:
        cuisine = get_cuisine_from_country(pays)
        if cuisine and cuisine not in cuisines:
            cuisines.append(cuisine)
    return cuisines

# -----------------------------
# LISTE DES CUISINES À RECHERCHER
# -----------------------------
# Liste complète de toutes les cuisines disponibles (générée depuis PAYS_TO_CUISINE)
# Toutes les cuisines uniques, triées par ordre alphabétique
CUISINES = sorted(list(set(PAYS_TO_CUISINE.values())))

# Si tu veux une liste manuelle personnalisée, tu peux remplacer par:
# CUISINES = [
#     "taïwanais",
#     "italien",
#     "japonais",
#     "mexicain",
#     "libanais",
#     "indien",
#     "éthiopien",
#     # ... etc
# ]


# -----------------------------
# DATA MODEL
# -----------------------------
@dataclass
class Place:
    cuisine: str
    name: str
    rating: Optional[float]
    reviews: Optional[int]
    address: Optional[str]
    url: str


# -----------------------------
# POSTGRESQL
# -----------------------------
def get_db_connection():
    """Crée une connexion à la base de données PostgreSQL"""
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Initialise la base de données et crée la table si elle n'existe pas"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        cuisine VARCHAR(255),
        name VARCHAR(255),
        rating REAL,
        reviews INTEGER,
        address TEXT,
        url TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    return conn

def save_places(conn, places: List[Place]):
    """Sauvegarde les restaurants dans la base de données"""
    cur = conn.cursor()
    for p in places:
        # Nettoyer l'adresse avant de sauvegarder
        cleaned_address = clean_address(p.address)
        # Générer l'URL au format search
        search_url = generate_google_maps_search_url(p.name, cleaned_address)
        
        cur.execute("""
        INSERT INTO restaurants (cuisine, name, rating, reviews, address, url)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (url) DO NOTHING
        """, (p.cuisine, p.name, p.rating, p.reviews, cleaned_address, search_url))
    conn.commit()

def clean_address(address):
    """Nettoie une adresse en supprimant les caractères non imprimables"""
    if not address:
        return None
    
    address = str(address)
    # Supprimer les caractères de contrôle et les caractères privés Unicode
    cleaned = ''.join(char for char in address if char.isprintable() or char.isspace())
    cleaned = re.sub(r'[\ue000-\uf8ff]', '', cleaned)  # Supprimer les caractères privés Unicode
    cleaned = re.sub(r'[\s\n\r\t]+', ' ', cleaned)  # Normaliser les espaces
    cleaned = cleaned.strip()
    
    return cleaned if cleaned else None

def generate_google_maps_search_url(name, address):
    """
    Génère une URL Google Maps au format:
    https://www.google.com/maps/search/?api=1&query=...
    """
    if not name:
        return None
    
    if address:
        query = f"{name} {address}"
    else:
        query = name
    
    encoded_query = quote_plus(query)
    url = f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
    
    return url

def export_to_csv(csv_path: str = "restaurants_export.csv"):
    """
    Exporte les données de la base PostgreSQL vers un fichier CSV.
    Les adresses sont déjà nettoyées et les URLs sont au format search.
    
    Args:
        csv_path: Chemin du fichier CSV à créer
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Récupérer toutes les données
    cur.execute("""
        SELECT cuisine, name, rating, reviews, address, url
        FROM restaurants
        ORDER BY cuisine, rating DESC NULLS FIRST
    """)
    
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        print(f"[ATTENTION] Aucune donnee a exporter")
        return
    
    # Écrire le CSV
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f, delimiter=';')
        # En-têtes
        writer.writerow(['Cuisine', 'Nom', 'Note', 'Avis', 'Adresse', 'URL'])
        # Données
        for row in rows:
            writer.writerow(row)
    
    print(f"[OK] Export CSV cree: {csv_path} ({len(rows)} restaurants)")
    print(f"[INFO] URLs au format: https://www.google.com/maps/search/?api=1&query=...")


# -----------------------------
# SELENIUM HELPERS
# -----------------------------
def make_driver():
    opts = Options()
    if HEADLESS:
        opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1400,900")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    # Astuce basique (pas magique) pour limiter certains soucis:
    opts.add_argument("--lang=fr-FR")
    # Utiliser webdriver-manager pour gérer automatiquement ChromeDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=opts)
    driver.set_page_load_timeout(60)
    return driver

def parse_float(s: str) -> Optional[float]:
    try:
        s = s.replace(",", ".").strip()
        return float(s)
    except Exception:
        return None

def parse_int(s: str) -> Optional[int]:
    try:
        s = s.replace("\u202f", " ").replace("\xa0", " ").strip()
        digits = "".join(ch for ch in s if ch.isdigit())
        return int(digits) if digits else None
    except Exception:
        return None

def accept_cookies_if_present(driver):
    # Selon les comptes/regions, le bouton cookies varie.
    # On essaie quelques libellés en FR/EN.
    possible_xpaths = [
        "//button//*[contains(text(),'Tout accepter')]/..",
        "//button//*[contains(text(),'Accepter tout')]/..",
        "//button//*[contains(text(),'I agree')]/..",
        "//button//*[contains(text(),'Accept all')]/..",
    ]
    for xp in possible_xpaths:
        try:
            btn = WebDriverWait(driver, 3).until(EC.element_to_be_clickable((By.XPATH, xp)))
            btn.click()
            time.sleep(1)
            return
        except Exception:
            pass

def wait_results_panel(driver):
    # Le panel de résultats (colonne gauche) a souvent role="feed"
    return WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'div[role="feed"]'))
    )

def find_search_box(driver):
    """
    Trouve le champ de recherche sur Google Maps avec plusieurs stratégies.
    Retourne l'élément si trouvé, None sinon.
    """
    print("[DEBUG] Recherche du champ de recherche...")
    
    # Stratégie 1: Sélecteurs standards
    selectors = [
        (By.ID, "searchboxinput"),
        (By.CSS_SELECTOR, "input#searchboxinput"),
        (By.CSS_SELECTOR, "input[aria-label*='Rechercher']"),
        (By.CSS_SELECTOR, "input[aria-label*='Search']"),
        (By.CSS_SELECTOR, "input[aria-label*='Recherche']"),
        (By.CSS_SELECTOR, "input[placeholder*='Rechercher']"),
        (By.CSS_SELECTOR, "input[placeholder*='Search']"),
    ]
    
    for selector_type, selector_value in selectors:
        try:
            print(f"[DEBUG] Essai avec: {selector_value}")
            element = WebDriverWait(driver, 3).until(
                EC.presence_of_element_located((selector_type, selector_value))
            )
            # Vérifier que c'est bien le champ de recherche principal
            aria_label = element.get_attribute("aria-label") or ""
            if "recherch" in aria_label.lower() or "search" in aria_label.lower() or selector_value == "searchboxinput":
                print(f"[OK] Champ de recherche trouve avec: {selector_value}")
                return element
        except Exception as e:
            print(f"[DEBUG] Echec avec {selector_value}: {str(e)[:50]}")
            continue
    
    # Stratégie 2: Chercher parmi tous les inputs
    print("[DEBUG] Recherche alternative parmi tous les inputs...")
    try:
        inputs = driver.find_elements(By.TAG_NAME, "input")
        print(f"[DEBUG] {len(inputs)} inputs trouves sur la page")
        
        for inp in inputs:
            try:
                if not inp.is_displayed():
                    continue
                    
                aria_label = inp.get_attribute("aria-label") or ""
                inp_id = inp.get_attribute("id") or ""
                inp_type = inp.get_attribute("type") or ""
                placeholder = inp.get_attribute("placeholder") or ""
                
                # Critères pour identifier le champ de recherche
                is_search = (
                    "recherch" in aria_label.lower() or 
                    "search" in aria_label.lower() or 
                    "searchbox" in inp_id.lower() or
                    "recherch" in placeholder.lower() or
                    "search" in placeholder.lower()
                )
                
                # Si c'est le seul input visible de type text sur la page principale, c'est probablement le champ de recherche
                # (Google Maps utilise parfois des IDs dynamiques comme "UGojuc")
                is_likely_search = (
                    inp_type in ["text", ""] and 
                    inp_id and  # A un ID (pas vide)
                    len([i for i in inputs if i.is_displayed() and (i.get_attribute("type") or "") in ["text", ""]]) <= 2
                )
                
                if (is_search or is_likely_search) and inp_type in ["text", ""]:
                    print(f"[OK] Champ de recherche trouve (id: {inp_id}, aria-label: {aria_label[:30]})")
                    return inp
            except Exception as e:
                continue
    except Exception as e:
        print(f"[DEBUG] Erreur lors de la recherche alternative: {e}")
    
    # Stratégie 3: Dernier recours - premier input visible de type text
    print("[DEBUG] Dernier recours: premier input visible de type text...")
    try:
        inputs = driver.find_elements(By.TAG_NAME, "input")
        for inp in inputs:
            try:
                if inp.is_displayed():
                    inp_type = inp.get_attribute("type") or ""
                    if inp_type in ["text", ""]:
                        print("[OK] Champ de recherche trouve (premier input visible de type text)")
                        return inp
            except:
                continue
    except Exception as e:
        print(f"[DEBUG] Erreur lors du dernier recours: {e}")
    
    return None

def scroll_feed_to_load(driver, feed, rounds=6):
    # Scrolle le panneau de résultats pour charger plus d'items
    for _ in range(rounds):
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", feed)
        time.sleep(1.2)

def open_search(driver, query: str):
    """Ouvre une recherche sur Google Maps"""
    print(f"[DEBUG] Recherche du champ de recherche pour la requete: {query}")
    
    # Utiliser la fonction find_search_box
    box = find_search_box(driver)
    
    if not box:
        raise Exception("Impossible de trouver le champ de recherche")
    
    # Cliquer sur le champ pour le rendre actif
    print("[DEBUG] Activation du champ de recherche...")
    try:
        box.click()
    except:
        try:
            driver.execute_script("arguments[0].click();", box)
        except Exception as e:
            print(f"[DEBUG] Erreur lors du clic: {e}")
            # Essayer de scroller vers l'élément
            driver.execute_script("arguments[0].scrollIntoView(true);", box)
            time.sleep(0.5)
            box.click()
    
    time.sleep(0.5)
    
    # Effacer et saisir la requête
    print(f"[DEBUG] Saisie de la requete: {query}")
    box.clear()
    time.sleep(0.3)
    box.send_keys(query)
    time.sleep(0.5)
    
    # Appuyer sur Entrée
    print("[DEBUG] Envoi de la recherche...")
    box.send_keys(Keys.ENTER)
    time.sleep(3)  # Attendre que les résultats se chargent
    
    print(f"[DEBUG] Recherche envoyee, attente des resultats...")

def pick_top_cards(driver, top_n: int):
    """
    Les items résultats sont souvent des <a class="hfpxzc"> dans le feed.
    On en récupère une liste, puis on clique chaque item pour obtenir le panneau détails.
    """
    feed = wait_results_panel(driver)
    scroll_feed_to_load(driver, feed, rounds=8)

    cards = driver.find_elements(By.CSS_SELECTOR, 'a.hfpxzc')
    # Certains résultats peuvent être des pubs/éléments non standards
    return cards[:top_n]

def read_place_details(driver) -> dict:
    """
    Lit le panneau détail (nom, note, avis, adresse, URL actuelle)
    """
    # Nom (souvent h1.DUwDvf)
    name = None
    try:
        name_el = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1.DUwDvf"))
        )
        name = name_el.text.strip()
    except Exception:
        pass

    # Note (souvent div.F7nice span[aria-hidden="true"] ou texte)
    rating = None
    reviews = None
    try:
        # bloc note/avis
        # Exemple: <div class="F7nice"><span aria-hidden="true">4,6</span> ... <span>(1 234)</span>
        rating_el = driver.find_element(By.CSS_SELECTOR, "div.F7nice span[aria-hidden='true']")
        rating = parse_float(rating_el.text)
    except Exception:
        pass

    try:
        # le nombre d'avis est souvent un span contenant "("
        spans = driver.find_elements(By.CSS_SELECTOR, "div.F7nice span")
        for sp in spans:
            t = sp.text.strip()
            if "(" in t and ")" in t:
                reviews = parse_int(t)
                break
    except Exception:
        pass

    # Adresse : bouton avec data-item-id="address"
    address = None
    try:
        addr_btn = driver.find_element(By.CSS_SELECTOR, 'button[data-item-id="address"]')
        address = addr_btn.text.strip()
    except Exception:
        # fallback : parfois c’est un div avec aria-label
        try:
            addr_alt = driver.find_element(By.XPATH, "//*[contains(@aria-label,'Adresse') or contains(@aria-label,'Address')]")
            address = addr_alt.text.strip()
        except Exception:
            pass

    url = driver.current_url

    return {"name": name, "rating": rating, "reviews": reviews, "address": address, "url": url}


def scrape_top_places_for_cuisine(driver, cuisine: str, city: str, top_n: int) -> List[Place]:
    query = f"Restaurant {cuisine} {city}"
    print(f"\n[Recherche] {query}")
    open_search(driver, query)

    # Attendre que les résultats soient chargés
    try:
        wait_results_panel(driver)
    except Exception:
        print("  -> Pas de panneau résultats (captcha / blocage / page différente).")
        return []

    cards = pick_top_cards(driver, top_n=top_n)

    places: List[Place] = []
    for idx, card in enumerate(cards, start=1):
        try:
            # Click sur le résultat
            driver.execute_script("arguments[0].click();", card)
            time.sleep(2.5)  # Pause pour charger les détails (augmente si captcha)

            details = read_place_details(driver)
            if not details["name"]:
                continue

            p = Place(
                cuisine=cuisine,
                name=details["name"],
                rating=details["rating"],
                reviews=details["reviews"],
                address=details["address"],
                url=details["url"],
            )
            places.append(p)
            print(f"  {idx}. {p.name} | {p.rating} ({p.reviews}) | {p.address}")
        except Exception as e:
            print(f"  -> Erreur item {idx}: {e}")

    return places


# -----------------------------
# MAIN
# -----------------------------
def main():
    conn = init_db()
    driver = make_driver()

    try:
        print("[INFO] Ouverture de Google Maps...")
        driver.get("https://www.google.com/maps")
        
        # Attendre que la page soit chargée
        time.sleep(3)
        
        # Accepter les cookies
        print("[INFO] Gestion des cookies...")
        accept_cookies_if_present(driver)
        time.sleep(2)
        
        # Attendre que le champ de recherche soit disponible
        print("[INFO] Attente du chargement complet de la page...")
        print(f"[DEBUG] URL actuelle: {driver.current_url}")
        print(f"[DEBUG] Titre de la page: {driver.title}")
        
        # Attendre un peu plus pour que la page soit complètement chargée
        time.sleep(2)
        
        try:
            search_box = find_search_box(driver)
            if search_box:
                print("[OK] Page chargee, pret a scraper!\n")
            else:
                raise Exception("Aucun champ de recherche trouve")
        except Exception as e:
            print(f"[ERREUR] Le champ de recherche n'a pas ete trouve: {e}")
            print("[DEBUG] Affichage de tous les inputs trouves sur la page...")
            try:
                inputs = driver.find_elements(By.TAG_NAME, "input")
                print(f"[DEBUG] Nombre total d'inputs: {len(inputs)}")
                for i, inp in enumerate(inputs[:10], 1):  # Afficher les 10 premiers
                    try:
                        inp_id = inp.get_attribute("id") or "N/A"
                        inp_type = inp.get_attribute("type") or "N/A"
                        aria_label = inp.get_attribute("aria-label") or "N/A"
                        placeholder = inp.get_attribute("placeholder") or "N/A"
                        is_displayed = inp.is_displayed()
                        print(f"  {i}. id={inp_id}, type={inp_type}, displayed={is_displayed}")
                        print(f"     aria-label={aria_label[:50]}, placeholder={placeholder[:50]}")
                    except Exception as ex:
                        print(f"  {i}. [Erreur lors de la lecture: {ex}]")
            except Exception as ex:
                print(f"[DEBUG] Erreur lors de l'analyse des inputs: {ex}")
            print("[ASTUCE] Verifie que Chrome est bien installe et que la page s'est chargee correctement.")
            print("[ASTUCE] Si HEADLESS=True, essaie avec HEADLESS=False pour voir ce qui se passe.")
            print("[ASTUCE] Tu peux aussi essayer de relancer le script dans quelques instants.")
            return

        for idx, cuisine in enumerate(CUISINES, start=1):
            print(f"\n{'='*60}")
            print(f"[{idx}/{len(CUISINES)}] Cuisine: {cuisine}")
            print(f"{'='*60}")
            
            places = scrape_top_places_for_cuisine(driver, cuisine, CITY, TOP_N)
            save_places(conn, places)
            
            # Pause entre chaque cuisine pour éviter les captchas
            if idx < len(CUISINES):  # Pas de pause après la dernière
                print(f"\n[PAUSE] Pause de {PAUSE_BETWEEN_CUISINES}s avant la prochaine cuisine...")
                time.sleep(PAUSE_BETWEEN_CUISINES)

        print(f"\n[OK] Termine. Donnees enregistrees dans PostgreSQL (Neon)")
        
        # Export CSV automatique
        export_to_csv()
        
        print("\n[ASTUCE] Les donnees sont stockees dans PostgreSQL (Neon).")

    finally:
        conn.close()
        driver.quit()


if __name__ == "__main__":
    main()
    
    # Pour exporter le CSV à tout moment (même après le scraping):
    # export_to_csv(DB_PATH, "mon_export.csv")