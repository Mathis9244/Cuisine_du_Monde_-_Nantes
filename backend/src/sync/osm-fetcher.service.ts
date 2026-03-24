/**
 * Service de récupération des restaurants depuis OpenStreetMap (API Overpass)
 */

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

function isOverpassResponse(value: unknown): value is OverpassResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { elements?: unknown }).elements)
  );
}

export interface OSMRestaurant {
  name: string;
  cuisine?: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  osmId?: string;
  osmType?: string;
  website?: string;
  phone?: string;
}

export class OSMFetcherService {
  private overpassUrls = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
  ];
  private currentUrlIndex = 0;

  async fetchRestaurantsNantes(
    cuisineFilter?: string,
  ): Promise<OSMRestaurant[]> {
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

    for (let attempt = 0; attempt < this.overpassUrls.length; attempt++) {
      const url = this.overpassUrls[this.currentUrlIndex];
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: query,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw: unknown = await response.json();
        if (!isOverpassResponse(raw)) {
          throw new Error('Invalid Overpass response');
        }
        const data = raw;
        const restaurants: OSMRestaurant[] = [];
        for (const el of data.elements || []) {
          if (
            (el.type === 'node' || el.type === 'way') &&
            el.tags?.amenity === 'restaurant'
          ) {
            const r = this.parseElement(el);
            if (r?.name) restaurants.push(r);
          }
        }
        return restaurants;
      } catch {
        this.currentUrlIndex =
          (this.currentUrlIndex + 1) % this.overpassUrls.length;
      }
    }
    return [];
  }

  private parseElement(el: OSMElement): OSMRestaurant | null {
    const tags = el.tags || {};
    let lat = el.lat;
    let lon = el.lon;
    if (el.type === 'way' && el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }
    const parts: string[] = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return {
      name: tags.name || '',
      cuisine: this.normalizeCuisine(tags.cuisine),
      address: parts.join(', ') || undefined,
      city: tags['addr:city'] || 'Nantes',
      latitude: lat,
      longitude: lon,
      osmId: String(el.id),
      osmType: el.type,
      website: tags.website,
      phone: tags.phone || tags['contact:phone'],
    };
  }

  private normalizeCuisine(cuisine?: string): string | undefined {
    if (!cuisine) return undefined;
    const lower = cuisine.toLowerCase().trim().split(';')[0].trim();
    const map: Record<string, string> = {
      italien: 'italian',
      italienne: 'italian',
      français: 'french',
      française: 'french',
      japonais: 'japanese',
      japonaise: 'japanese',
      chinois: 'chinese',
      chinoise: 'chinese',
      indien: 'indian',
      indienne: 'indian',
      mexicain: 'mexican',
      mexicaine: 'mexican',
      thaï: 'thai',
      thaïlandais: 'thai',
      thaïlandaise: 'thai',
      libanais: 'lebanese',
      libanaise: 'lebanese',
      espagnol: 'spanish',
      espagnole: 'spanish',
      grec: 'greek',
      grecque: 'greek',
      turc: 'turkish',
      turque: 'turkish',
      marocain: 'moroccan',
      marocaine: 'moroccan',
      vietnamien: 'vietnamese',
      vietnamienne: 'vietnamese',
      coréen: 'korean',
      coréenne: 'korean',
      américain: 'american',
      américaine: 'american',
      méditerranéen: 'mediterranean',
      méditerranéenne: 'mediterranean',
      asiatique: 'asian',
      fruits_de_mer: 'seafood',
      poisson: 'seafood',
    };
    return (
      map[lower] ||
      ([
        'italian',
        'french',
        'japanese',
        'chinese',
        'indian',
        'mexican',
        'thai',
        'lebanese',
        'spanish',
        'greek',
        'turkish',
        'moroccan',
        'vietnamese',
        'korean',
        'american',
        'mediterranean',
        'asian',
        'seafood',
      ].includes(lower)
        ? lower
        : lower.length < 30
          ? lower
          : undefined)
    );
  }
}
