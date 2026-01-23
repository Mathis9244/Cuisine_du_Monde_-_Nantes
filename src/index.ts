/**
 * Récupération des restaurants à Nantes depuis OpenStreetMap (OSM).
 * Utilise l'API Overpass - 100% légal, gratuit, pas de scraping.
 * 
 * Utilise Bun - Runtime JavaScript/TypeScript rapide
 * https://bun.com/
 */

import { Database } from "bun:sqlite";
import { writeFile } from "fs/promises";
import { join } from "path";

interface Restaurant {
  name: string;
  cuisine?: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  osm_id?: string;
  osm_type?: string;
  website?: string;
  phone?: string;
}

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

class OSMRestaurantFetcher {
  private dbName: string;
  private db?: Database;
  private overpassUrls: string[] = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
  ];
  private currentUrlIndex: number = 0;

  constructor(dbName: string = "restaurants_nantes_osm.db") {
    this.dbName = dbName;
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db = new Database(this.dbName);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cuisine TEXT,
        address TEXT,
        city TEXT DEFAULT 'Nantes',
        latitude REAL,
        longitude REAL,
        osm_id TEXT,
        osm_type TEXT,
        website TEXT,
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async fetchRestaurantsNantes(cuisineFilter?: string): Promise<Restaurant[]> {
    console.log("=".repeat(80));
    console.log("🍽️  RÉCUPÉRATION DES RESTAURANTS - OPENSTREETMAP");
    console.log("=".repeat(80));
    console.log("\n📡 Connexion à l'API Overpass (OpenStreetMap)...");
    console.log("   ✅ 100% légal et gratuit - Pas de scraping");
    console.log("   🚀 Utilise Bun - Runtime JavaScript rapide");

    // Requête Overpass QL pour Nantes
    // Zone de Nantes: bbox approximative
    // Latitude: 47.18 à 47.25, Longitude: -1.60 à -1.50
    const query = cuisineFilter
      ? `
        [out:json][timeout:15];
        (
          node["amenity"="restaurant"]["cuisine"~"${cuisineFilter}",i](47.18,-1.60,47.25,-1.50);
          way["amenity"="restaurant"]["cuisine"~"${cuisineFilter}",i](47.18,-1.60,47.25,-1.50);
        );
        out center;
      `
      : `
        [out:json][timeout:15];
        (
          node["amenity"="restaurant"](47.18,-1.60,47.25,-1.50);
          way["amenity"="restaurant"](47.18,-1.60,47.25,-1.50);
        );
        out center;
      `;

    // Essayer avec retry sur plusieurs serveurs
    const maxRetries = this.overpassUrls.length;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const overpassUrl = this.overpassUrls[this.currentUrlIndex];
      const serverName = overpassUrl.split("//")[1].split("/")[0];

      try {
        console.log(`\n🔍 Recherche des restaurants${cuisineFilter ? ` (${cuisineFilter})` : ""}...`);
        console.log(`   Serveur: ${serverName} (tentative ${attempt + 1}/${maxRetries})`);

        const response = await fetch(overpassUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: query,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: OverpassResponse = await response.json();
        const elements = data.elements || [];

        console.log(`   ✅ ${elements.length} éléments trouvés dans OSM`);

        const restaurants: Restaurant[] = [];
        for (const element of elements) {
          if (element.type === "node" || element.type === "way") {
            const restaurant = this.parseOSMElement(element);
            if (restaurant && restaurant.name) {
              restaurants.push(restaurant);
            }
          }
        }

        console.log(`   ✅ ${restaurants.length} restaurants avec nom trouvés`);
        return restaurants;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`   ⚠️  Erreur sur le serveur ${serverName}: ${errorMessage}`);
        
        if (attempt < maxRetries - 1) {
          this.currentUrlIndex = (this.currentUrlIndex + 1) % this.overpassUrls.length;
          console.log(`   🔄 Essai avec un autre serveur...`);
          continue;
        } else {
          console.log(`   ❌ Tous les serveurs ont échoué. Réessayez plus tard.`);
          return [];
        }
      }
    }

    return [];
  }

  private parseOSMElement(element: OSMElement): Restaurant | null {
    const tags = element.tags || {};

    if (tags.amenity !== "restaurant") {
      return null;
    }

    // Pour les ways, utiliser center si disponible
    let lat = element.lat;
    let lon = element.lon;
    if (element.type === "way" && element.center) {
      lat = element.center.lat;
      lon = element.center.lon;
    }

    return {
      name: tags.name || "",
      cuisine: this.normalizeCuisine(tags.cuisine),
      address: this.buildAddress(tags),
      city: tags["addr:city"] || "Nantes",
      latitude: lat,
      longitude: lon,
      osm_id: String(element.id),
      osm_type: element.type,
      website: tags.website,
      phone: tags.phone || tags["contact:phone"],
    };
  }

  private buildAddress(tags: Record<string, string>): string {
    const parts: string[] = [];
    if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
    if (tags["addr:street"]) parts.push(tags["addr:street"]);
    if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
    if (tags["addr:city"]) parts.push(tags["addr:city"]);
    return parts.join(", ");
  }

  private normalizeCuisine(cuisine?: string): string | undefined {
    if (!cuisine) return undefined;

    const cuisineLower = cuisine.toLowerCase().trim();
    const cuisineParts = cuisineLower.split(";");
    const firstCuisine = cuisineParts[0].trim();

    const cuisineMap: Record<string, string> = {
      italien: "italian",
      italienne: "italian",
      français: "french",
      française: "french",
      japonais: "japanese",
      japonaise: "japanese",
      chinois: "chinese",
      chinoise: "chinese",
      indien: "indian",
      indienne: "indian",
      mexicain: "mexican",
      mexicaine: "mexican",
      thaï: "thai",
      thaïlandais: "thai",
      thaïlandaise: "thai",
      libanais: "lebanese",
      libanaise: "lebanese",
      espagnol: "spanish",
      espagnole: "spanish",
      grec: "greek",
      grecque: "greek",
      turc: "turkish",
      turque: "turkish",
      marocain: "moroccan",
      marocaine: "moroccan",
      vietnamien: "vietnamese",
      vietnamienne: "vietnamese",
      coréen: "korean",
      coréenne: "korean",
      américain: "american",
      américaine: "american",
      méditerranéen: "mediterranean",
      méditerranéenne: "mediterranean",
      asiatique: "asian",
      fruits_de_mer: "seafood",
      poisson: "seafood",
    };

    if (firstCuisine in cuisineMap) {
      return cuisineMap[firstCuisine];
    }

    const standardCuisines = [
      "italian", "french", "japanese", "chinese", "indian",
      "mexican", "thai", "lebanese", "spanish", "greek",
      "turkish", "moroccan", "vietnamese", "korean", "american",
      "mediterranean", "asian", "seafood",
    ];

    if (standardCuisines.includes(firstCuisine)) {
      return firstCuisine;
    }

    for (const [key, value] of Object.entries(cuisineMap)) {
      if (firstCuisine.includes(key)) {
        return value;
      }
    }

    return firstCuisine.length < 30 ? firstCuisine : undefined;
  }

  private cuisineToCountry(cuisine?: string): string {
    if (!cuisine) return "";

    const cuisineParts = cuisine.split(";");
    const cuisineLower = cuisineParts[0].toLowerCase().trim();

    const cuisineToCountryMap: Record<string, string> = {
      chinese: "Chine",
      chinois: "Chine",
      chinoise: "Chine",
      japanese: "Japon",
      japonais: "Japon",
      japonaise: "Japon",
      indian: "Inde",
      indien: "Inde",
      indienne: "Inde",
      thai: "Thaïlande",
      thaï: "Thaïlande",
      thaïlandais: "Thaïlande",
      thaïlandaise: "Thaïlande",
      vietnamese: "Vietnam",
      vietnamien: "Vietnam",
      vietnamienne: "Vietnam",
      korean: "Corée",
      coréen: "Corée",
      coréenne: "Corée",
      lebanese: "Liban",
      libanais: "Liban",
      libanaise: "Liban",
      turkish: "Turquie",
      turc: "Turquie",
      turque: "Turquie",
      italian: "Italie",
      italien: "Italie",
      italienne: "Italie",
      french: "France",
      français: "France",
      française: "France",
      spanish: "Espagne",
      espagnol: "Espagne",
      espagnole: "Espagne",
      greek: "Grèce",
      grec: "Grèce",
      grecque: "Grèce",
      mexican: "Mexique",
      mexicain: "Mexique",
      mexicaine: "Mexique",
      american: "États-Unis",
      américain: "États-Unis",
      américaine: "États-Unis",
      moroccan: "Maroc",
      marocain: "Maroc",
      marocaine: "Maroc",
      ethiopian: "Éthiopie",
      éthiopien: "Éthiopie",
      éthiopienne: "Éthiopie",
      ethiopie: "Éthiopie",
      mediterranean: "Méditerranée",
      méditerranéen: "Méditerranée",
      méditerranéenne: "Méditerranée",
      asian: "Asie",
      asiatique: "Asie",
      seafood: "Fruits de mer",
      fruits_de_mer: "Fruits de mer",
      poisson: "Fruits de mer",
    };

    if (cuisineLower in cuisineToCountryMap) {
      return cuisineToCountryMap[cuisineLower];
    }

    for (const [key, country] of Object.entries(cuisineToCountryMap)) {
      if (cuisineLower.includes(key)) {
        return country;
      }
    }

    return "";
  }

  private isFrenchRestaurant(cuisine?: string): boolean {
    if (!cuisine) return false;

    const cuisineLower = cuisine.toLowerCase().trim();
    const frenchKeywords = [
      "french", "français", "française", "france", "bistrot",
      "brasserie", "bouchon", "crepe", "crêpe", "galette", "regional", "régional",
    ];

    return frenchKeywords.some((keyword) => cuisineLower.includes(keyword));
  }

  private createGoogleMapsLink(latitude?: number, longitude?: number): string {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    }
    return "";
  }

  async exportToCSV(
    restaurants: Restaurant[],
    outputFile: string = "restaurants_nantes_osm.csv",
    excludeFrench: boolean = true
  ): Promise<boolean> {
    if (!restaurants.length) {
      console.log("⚠️  Aucun restaurant à exporter.");
      return false;
    }

    console.log(`\n💾 Export en CSV: ${outputFile}`);

    // Filtrer les restaurants français si demandé
    let filteredRestaurants = restaurants;
    if (excludeFrench) {
      const excluded = restaurants.filter((r) => this.isFrenchRestaurant(r.cuisine));
      filteredRestaurants = restaurants.filter((r) => !this.isFrenchRestaurant(r.cuisine));
      
      if (excluded.length > 0) {
        console.log(`   ⚠️  ${excluded.length} restaurant(s) français exclu(s)`);
      }
    }

    if (!filteredRestaurants.length) {
      console.log("⚠️  Aucun restaurant à exporter après filtrage.");
      return false;
    }

    // Créer le CSV
    const headers = ["nom", "typedecuisine", "adresse", "ville", "lien_google_maps", "phone"];
    const rows: string[][] = [headers];

    for (const restaurant of filteredRestaurants) {
      const country = this.cuisineToCountry(restaurant.cuisine);
      
      // Ne pas exporter si pas de type de cuisine identifié (sauf si explicitement demandé)
      if (excludeFrench && !country) {
        continue;
      }

      const googleMapsLink = this.createGoogleMapsLink(restaurant.latitude, restaurant.longitude);

      rows.push([
        restaurant.name || "",
        country,
        restaurant.address || "",
        restaurant.city || "Nantes",
        googleMapsLink,
        restaurant.phone || "",
      ]);
    }

    // Convertir en CSV
    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    try {
      await writeFile(outputFile, csvContent, "utf-8");
      console.log(`✅ ${rows.length - 1} restaurants exportés vers ${outputFile}`);
      return true;
    } catch (error) {
      console.log(`❌ Erreur lors de l'export CSV: ${error}`);
      return false;
    }
  }

  async fetchAndExportCSV(
    outputFile: string = "restaurants_nantes_osm.csv",
    cuisineFilter?: string,
    excludeFrench: boolean = true
  ): Promise<void> {
    const restaurants = await this.fetchRestaurantsNantes(cuisineFilter);

    if (!restaurants.length) {
      console.log("\n⚠️  Aucun restaurant trouvé.");
      return;
    }

    // Statistiques avant export
    const cuisinesFound: Record<string, number> = {};
    for (const restaurant of restaurants) {
      const cuisine = restaurant.cuisine;
      if (cuisine && !(excludeFrench && this.isFrenchRestaurant(cuisine))) {
        cuisinesFound[cuisine] = (cuisinesFound[cuisine] || 0) + 1;
      }
    }

    // Export CSV
    if (await this.exportToCSV(restaurants, outputFile, excludeFrench)) {
      const exportedCount = restaurants.filter(
        (r) => !(excludeFrench && this.isFrenchRestaurant(r.cuisine))
      ).length;

      console.log(`\n📊 Statistiques:`);
      console.log(`   Total récupéré: ${restaurants.length} restaurants`);
      console.log(`   Exportés (hors français): ${exportedCount} restaurants`);
      console.log(
        `   Avec coordonnées GPS: ${restaurants.filter((r) => r.latitude).length}`
      );

      if (Object.keys(cuisinesFound).length > 0) {
        console.log(
          `\n🍽️  Types de cuisines trouvés (${Object.keys(cuisinesFound).length} types):`
        );
        const sorted = Object.entries(cuisinesFound).sort((a, b) => b[1] - a[1]);
        for (const [cuisine, count] of sorted) {
          console.log(`   ${cuisine.padEnd(20)} : ${String(count).padStart(3)} restaurant(s)`);
        }
      }
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// Fonction principale
async function main() {
  console.log("\n🍽️  RÉCUPÉRATION RESTAURANTS NANTES - OPENSTREETMAP");
  console.log("=".repeat(80));
  console.log("\n✅ 100% légal - Utilise l'API publique Overpass");
  console.log("✅ Gratuit - Pas de scraping");
  console.log("✅ Données ouvertes et collaboratives");
  console.log("🚀 Utilise Bun - Runtime JavaScript/TypeScript rapide");
  console.log("=".repeat(80));

  console.log("\nOptions d'export:");
  console.log("  1. Export CSV uniquement (recommandé pour commencer)");
  console.log("  2. Sauvegarder dans la base de données");
  console.log("  3. Les deux (CSV + base de données)");

  // Pour l'instant, on fait juste l'export CSV
  // Dans une version complète, on pourrait utiliser readline ou un package CLI
  const exportChoice = process.argv[2] || "1";
  const cuisineFilter = process.argv[3];
  const outputFile = process.argv[4] || "restaurants_nantes_osm.csv";

  const fetcher = new OSMRestaurantFetcher();

  try {
    if (exportChoice === "1" || !exportChoice) {
      await fetcher.fetchAndExportCSV(outputFile, cuisineFilter, true);
    } else {
      console.log("Options 2 et 3 à implémenter si nécessaire");
    }
  } finally {
    fetcher.close();
  }
}

// Exécuter si c'est le script principal
if (import.meta.main) {
  main().catch(console.error);
}
