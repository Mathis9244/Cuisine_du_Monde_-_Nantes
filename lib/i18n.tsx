"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Locale = "fr" | "en";

const STORAGE_KEY = "cdm-locale";
const DEFAULT_LOCALE: Locale = "fr";

type Dict = Record<string, string>;

const fr: Dict = {
  "loading": "Chargement...",
  // Navigation
  "nav.feed": "Feed",
  "nav.map": "Carte",
  "nav.spin": "Roue",
  "nav.ai": "IA",
  "nav.you": "Profil",
  "nav.home": "Accueil / Roulette",
  "nav.admin": "Back-office",
  "nav.return": "Retour",
  // Auth
  "auth.tagline": "Accès vérifié uniquement",
  "auth.name": "NOM",
  "auth.email": "EMAIL",
  "auth.password": "MOT DE PASSE",
  "auth.enter": "Entrer",
  "auth.join": "Rejoindre",
  "auth.toLogin": "Retour connexion",
  "auth.toJoin": "Nouveau membre",
  "auth.error": "Erreur de connexion",
  // Setup
  "setup.title": "Configuration requise",
  "setup.intro":
    "Les variables Supabase sont manquantes. Crée le fichier web/.env.local à partir de web/.env.example, renseigne tes clés, puis redémarre le serveur de dev.",
  "setup.hint": "Les clés se trouvent dans Supabase → Project Settings → API.",
  // Feed
  "feed.search": "Rechercher...",
  "feed.filters": "Filtres",
  "feed.filter.all": "Tous",
  "feed.filter.top": "Top notés",
  "feed.filter.reviews": "Avec avis",
  "feed.filter.website": "Site web",
  "feed.empty": "Aucun restaurant pour l'instant",
  "feed.loadMore": "Charger plus",
  "feed.clearFilter": "Filtre : {cuisine}",
  "feed.loadingMore": "Chargement…",
  // Rating
  "rate.title": "Noter",
  "rate.cancel": "Annuler",
  "rate.button": "Noter",
  "rate.tap": "Touchez pour noter",
  "rate.value": "Note : {n}.0",
  // Card / list
  "card.maps": "Ouvrir dans Maps",
  "list.all": "Tout {count}",
  // Profile
  "profile.member": "Membre du cercle",
  "profile.reviews": "Avis",
  "profile.countries": "Pays",
  "profile.avg": "Note moy.",
  "profile.log": "Journal vérifié",
  "profile.allRatings": "Toutes les notes",
  "profile.empty": "Aucun restaurant enregistré",
  // Wheel
  "wheel.title": "Atlas Destiny",
  "wheel.subtitle": "La roue choisit ta cuisine",
  "wheel.direction": "Direction",
  "wheel.spin": "Tourner la roue",
  "wheel.spinning": "Sélection...",
  // AI
  "ai.welcome":
    "Bonjour ! Je suis votre assistant culinaire nantais. Posez-moi vos questions sur les restaurants du cercle, ou demandez des recommandations à Nantes !",
  "ai.title": "AI Research",
  "ai.subtitle": "Saveurs, lieux ou recommandations",
  "ai.placeholder": "Posez une question sur un restaurant...",
  "ai.thinking": "Réflexion...",
  "ai.errorPrefix": "Désolé, une erreur est survenue : {msg}",
  "ai.errorGeneric": "Désolé, une erreur est survenue. Réessayez.",
  // Map
  "map.title": "Carte",
  "map.loading": "Chargement de la carte…",
  "map.count": "{count} restaurant(s) géolocalisé(s)",
  "map.directions": "Itinéraire",
  // Home
  "home.subtitle": "Nantes · Le cercle des explorateurs culinaires",
  "home.lead":
    "Pas d'idée ce soir ? Laisse la roulette choisir une cuisine, puis découvre les restaurants correspondants.",
  "home.seeAll": "Voir tous les restaurants",
  "home.errorHint":
    "Vérifie la configuration Supabase (web/.env.local) et la table restaurants.",
  "home.empty": "Aucune cuisine disponible pour l'instant",
  // Admin
  "admin.title": "Back-office",
  "admin.back": "Retour",
  "admin.search": "Rechercher...",
  "admin.includeInactive": "Inclure inactifs",
  "admin.results": "{count} résultats",
  "admin.forbidden.title": "Accès refusé",
  "admin.forbidden.body":
    "Cette zone est réservée aux administrateurs. Connectez-vous avec un compte ayant le rôle admin dans Supabase.",
  "admin.ph.cuisine": "cuisine",
  "admin.ph.address": "adresse",
  "admin.ph.phone": "téléphone",
  "admin.save": "Enregistrer",
  "admin.activate": "Activer",
  "admin.deactivate": "Désactiver",
  // Theme
  "theme.system": "Auto",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
  "theme.label": "Thème : {v}",
  // Language
  "lang.label": "Langue",
  "lang.auto": "Auto",
};

const en: Dict = {
  "loading": "Loading...",
  "nav.feed": "Feed",
  "nav.map": "Map",
  "nav.spin": "Spin",
  "nav.ai": "AI",
  "nav.you": "You",
  "nav.home": "Home / Wheel",
  "nav.admin": "Back-office",
  "nav.return": "Return",
  "auth.tagline": "Verified Access Only",
  "auth.name": "NAME",
  "auth.email": "EMAIL",
  "auth.password": "PASSWORD",
  "auth.enter": "Enter",
  "auth.join": "Join",
  "auth.toLogin": "Return to Login",
  "auth.toJoin": "New Membership",
  "auth.error": "Login error",
  "setup.title": "Setup required",
  "setup.intro":
    "Supabase variables are missing. Create web/.env.local from web/.env.example, fill in your keys, then restart the dev server.",
  "setup.hint": "Keys are in Supabase → Project Settings → API.",
  "feed.search": "Search...",
  "feed.filters": "Filters",
  "feed.filter.all": "All",
  "feed.filter.top": "Top rated",
  "feed.filter.reviews": "With reviews",
  "feed.filter.website": "Website",
  "feed.empty": "No restaurants yet",
  "feed.loadMore": "Load more",
  "feed.clearFilter": "Filter: {cuisine}",
  "feed.loadingMore": "Loading…",
  "rate.title": "Rate",
  "rate.cancel": "Cancel",
  "rate.button": "Rate",
  "rate.tap": "Tap to score",
  "rate.value": "Rating: {n}.0",
  "card.maps": "Open in Maps",
  "list.all": "All {count}",
  "profile.member": "Circle Member",
  "profile.reviews": "Reviews",
  "profile.countries": "Countries",
  "profile.avg": "Avg Score",
  "profile.log": "Verified Log",
  "profile.allRatings": "All Ratings",
  "profile.empty": "No restaurants logged yet",
  "wheel.title": "Atlas Destiny",
  "wheel.subtitle": "The wheel picks your cuisine",
  "wheel.direction": "Heading to",
  "wheel.spin": "Spin the wheel",
  "wheel.spinning": "Selecting...",
  "ai.welcome":
    "Hi! I'm your Nantes culinary assistant. Ask me anything about the circle's restaurants, or for recommendations in Nantes!",
  "ai.title": "AI Research",
  "ai.subtitle": "Ask about flavors, places, or recommendations",
  "ai.placeholder": "Ask about a restaurant...",
  "ai.thinking": "Thinking...",
  "ai.errorPrefix": "Sorry, an error occurred: {msg}",
  "ai.errorGeneric": "Sorry, something went wrong. Try again.",
  "map.title": "Map",
  "map.loading": "Loading map…",
  "map.count": "{count} located restaurant(s)",
  "map.directions": "Directions",
  "home.subtitle": "Nantes · The circle of culinary explorers",
  "home.lead":
    "No idea tonight? Let the wheel pick a cuisine, then discover matching restaurants.",
  "home.seeAll": "See all restaurants",
  "home.errorHint":
    "Check the Supabase config (web/.env.local) and the restaurants table.",
  "home.empty": "No cuisine available yet",
  "admin.title": "Back-office",
  "admin.back": "Back",
  "admin.search": "Search...",
  "admin.includeInactive": "Include inactive",
  "admin.results": "{count} results",
  "admin.forbidden.title": "Access denied",
  "admin.forbidden.body":
    "This area is admin-only. Sign in with an account having the admin role in Supabase.",
  "admin.ph.cuisine": "cuisine",
  "admin.ph.address": "address",
  "admin.ph.phone": "phone",
  "admin.save": "Save",
  "admin.activate": "Activate",
  "admin.deactivate": "Deactivate",
  "theme.system": "Auto",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.label": "Theme: {v}",
  "lang.label": "Language",
  "lang.auto": "Auto",
};

const DICTS: Record<Locale, Dict> = { fr, en };

type TParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  isManual: boolean;
  localeLabel: string;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  t: (key: string, params?: TParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectSystemLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang =
    (navigator.languages && navigator.languages[0]) || navigator.language || "";
  return lang.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "fr" || stored === "en") {
      setLocaleState(stored);
      setIsManual(true);
    } else {
      const sys = detectSystemLocale();
      setLocaleState(sys);
      setIsManual(false);
    }
    document.documentElement.setAttribute(
      "lang",
      stored === "fr" || stored === "en" ? stored : detectSystemLocale(),
    );
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setIsManual(true);
    localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", l);
    }
  }, []);

  const toggle = useCallback(() => {
    if (!isManual) {
      setLocale("fr");
      return;
    }
    if (locale === "fr") {
      setLocale("en");
      return;
    }
    setIsManual(false);
    localStorage.removeItem(STORAGE_KEY);
    const sys = detectSystemLocale();
    setLocaleState(sys);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", sys);
    }
  }, [isManual, locale, setLocale]);

  const localeLabel = isManual ? locale : "auto";

  const t = useCallback(
    (key: string, params?: TParams) => {
      const value = DICTS[locale][key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
      return interpolate(value, params);
    },
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{ locale, isManual, localeLabel, setLocale, toggle, t }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return ctx;
}
