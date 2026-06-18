import { countryToCuisine } from "@/lib/mappers";

export type ContinentId =
  | "europe"
  | "africa"
  | "asia"
  | "americas"
  | "oceania"
  | "middle_east"
  | "other";

export const CONTINENT_ORDER: ContinentId[] = [
  "europe",
  "africa",
  "asia",
  "middle_east",
  "americas",
  "oceania",
  "other",
];

/** Slug cuisine (base) → continent */
const CUISINE_TO_CONTINENT: Record<string, ContinentId> = {
  // Europe
  albanian: "europe",
  austrian: "europe",
  belgian: "europe",
  bosnian: "europe",
  british: "europe",
  bulgarian: "europe",
  croatian: "europe",
  czech: "europe",
  danish: "europe",
  dutch: "europe",
  english: "europe",
  estonian: "europe",
  finnish: "europe",
  french: "europe",
  german: "europe",
  greek: "europe",
  hungarian: "europe",
  irish: "europe",
  italian: "europe",
  latvian: "europe",
  lithuanian: "europe",
  luxembourgish: "europe",
  macedonian: "europe",
  maltese: "europe",
  moldovan: "europe",
  montenegrin: "europe",
  norwegian: "europe",
  polish: "europe",
  portuguese: "europe",
  romanian: "europe",
  russian: "europe",
  scottish: "europe",
  serbian: "europe",
  slovak: "europe",
  slovenian: "europe",
  spanish: "europe",
  swedish: "europe",
  swiss: "europe",
  ukrainian: "europe",
  welsh: "europe",
  // Afrique
  algerian: "africa",
  angolan: "africa",
  beninese: "africa",
  botswanan: "africa",
  burkinabe: "africa",
  burundian: "africa",
  cameroonian: "africa",
  cape_verdean: "africa",
  chadian: "africa",
  congolese: "africa",
  egyptian: "africa",
  eritrean: "africa",
  ethiopian: "africa",
  gabonese: "africa",
  gambian: "africa",
  ghanaian: "africa",
  guinean: "africa",
  ivorian: "africa",
  kenyan: "africa",
  libyan: "africa",
  malagasy: "africa",
  malawian: "africa",
  malian: "africa",
  mauritanian: "africa",
  moroccan: "africa",
  mozambican: "africa",
  namibian: "africa",
  nigerian: "africa",
  rwandan: "africa",
  senegalese: "africa",
  sierra_leonean: "africa",
  somali: "africa",
  south_african: "africa",
  sudanese: "africa",
  tanzanian: "africa",
  togolese: "africa",
  tunisian: "africa",
  ugandan: "africa",
  zambian: "africa",
  zimbabwean: "africa",
  // Asie
  afghan: "asia",
  armenian: "asia",
  azerbaijani: "asia",
  bangladeshi: "asia",
  bhutanese: "asia",
  burmese: "asia",
  cambodian: "asia",
  chinese: "asia",
  filipino: "asia",
  georgian: "asia",
  indian: "asia",
  indonesian: "asia",
  japanese: "asia",
  kazakh: "asia",
  korean: "asia",
  laotian: "asia",
  malaysian: "asia",
  mongolian: "asia",
  nepalese: "asia",
  pakistani: "asia",
  singaporean: "asia",
  sri_lankan: "asia",
  taiwanese: "asia",
  thai: "asia",
  tibetan: "asia",
  turkmen: "asia",
  uzbek: "asia",
  vietnamese: "asia",
  asian: "asia",
  // Moyen-Orient
  bahraini: "middle_east",
  emirati: "middle_east",
  iranian: "middle_east",
  iraqi: "middle_east",
  israeli: "middle_east",
  jordanian: "middle_east",
  kuwaiti: "middle_east",
  lebanese: "middle_east",
  omani: "middle_east",
  palestinian: "middle_east",
  qatari: "middle_east",
  saudi: "middle_east",
  syrian: "middle_east",
  turkish: "middle_east",
  yemeni: "middle_east",
  // Amériques
  american: "americas",
  argentinian: "americas",
  bolivian: "americas",
  brazilian: "americas",
  canadian: "americas",
  chilean: "americas",
  colombian: "americas",
  costa_rican: "americas",
  cuban: "americas",
  dominican: "americas",
  ecuadorian: "americas",
  guatemalan: "americas",
  haitian: "americas",
  honduran: "americas",
  jamaican: "americas",
  mexican: "americas",
  nicaraguan: "americas",
  panamanian: "americas",
  paraguayan: "americas",
  peruvian: "americas",
  puerto_rican: "americas",
  salvadoran: "americas",
  uruguayan: "americas",
  venezuelan: "americas",
  // Océanie
  australian: "oceania",
  fijian: "oceania",
  hawaiian: "oceania",
  maori: "oceania",
  polynesian: "oceania",
  samoan: "oceania",
  tongan: "oceania",
  // Autre
  mediterranean: "other",
  seafood: "other",
};

/** Pays affichés (UI) → continent */
const COUNTRY_TO_CONTINENT: Record<string, ContinentId> = {
  China: "asia",
  Japan: "asia",
  India: "asia",
  Thailand: "asia",
  Vietnam: "asia",
  Korea: "asia",
  Italy: "europe",
  France: "europe",
  Spain: "europe",
  Greece: "europe",
  Mexico: "americas",
  USA: "americas",
  Morocco: "africa",
  Ethiopia: "africa",
  Lebanon: "middle_east",
  Turkey: "middle_east",
  Mediterranean: "other",
  Asia: "asia",
  Seafood: "other",
  World: "other",
};

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "_");
}

export function getContinentForCountry(country: string): ContinentId {
  if (!country.trim()) return "other";

  const direct = COUNTRY_TO_CONTINENT[country];
  if (direct) return direct;

  const slug = countryToCuisine(country);
  const fromSlug = CUISINE_TO_CONTINENT[normalizeKey(slug)];
  if (fromSlug) return fromSlug;

  const fromCountrySlug = CUISINE_TO_CONTINENT[normalizeKey(country)];
  if (fromCountrySlug) return fromCountrySlug;

  return "other";
}

export function filterCountriesByContinent(
  countries: string[],
  continent: string,
): string[] {
  if (!continent) return countries;
  return countries.filter((c) => getContinentForCountry(c) === continent);
}

export function groupCountriesByContinent(
  countries: string[],
): { continent: ContinentId; countries: string[] }[] {
  const buckets = new Map<ContinentId, string[]>();

  for (const country of countries) {
    const continent = getContinentForCountry(country);
    const list = buckets.get(continent) ?? [];
    list.push(country);
    buckets.set(continent, list);
  }

  return CONTINENT_ORDER.filter((id) => buckets.has(id)).map((continent) => ({
    continent,
    countries: (buckets.get(continent) ?? []).sort((a, b) =>
      a.localeCompare(b, "fr"),
    ),
  }));
}

export function groupRestaurantsByContinent(
  grouped: Record<string, import("@/lib/types").Restaurant[]>,
): {
  continent: ContinentId;
  countries: { country: string; items: import("@/lib/types").Restaurant[] }[];
}[] {
  const countries = Object.keys(grouped);
  const byContinent = groupCountriesByContinent(countries);

  return byContinent.map(({ continent, countries: continentCountries }) => ({
    continent,
    countries: continentCountries.map((country) => ({
      country,
      items: grouped[country] ?? [],
    })),
  }));
}
