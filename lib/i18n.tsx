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
  "nav.spin": "Explorer",
  "nav.wheel": "Roue",
  "nav.ai": "IA",
  "nav.you": "Profil",
  "nav.home": "Accueil / Roulette",
  "nav.admin": "Back-office",
  "nav.return": "Retour",
  "nav.preferences": "Préférences",
  "nav.account": "Compte",
  // Auth
  "auth.tagline": "Accès vérifié uniquement",
  "auth.name": "NOM",
  "auth.email": "EMAIL",
  "auth.password": "MOT DE PASSE",
  "auth.enter": "Entrer",
  "auth.join": "Rejoindre",
  "auth.toLogin": "Retour connexion",
  "auth.toJoin": "Nouveau membre",
  "auth.logout": "Déconnexion",
  "auth.error": "Erreur de connexion",
  // Setup
  "setup.title": "Configuration requise",
  "setup.intro":
    "Les variables Supabase sont manquantes. Crée le fichier web/.env.local à partir de web/.env.example, renseigne tes clés, puis redémarre le serveur de dev.",
  "setup.hint": "Les clés se trouvent dans Supabase → Project Settings → API.",
  // Feed
  "feed.search": "Rechercher...",
  "feed.heroTitle": "Trouve ton prochain resto en quelques secondes.",
  "feed.heroLead":
    "Recherche rapide, carte à proximité et recommandations personnalisées pour aller droit au but.",
  "feed.heroPrimary": "Recherche avancée",
  "feed.heroSecondary": "Ouvrir la carte",
  "feed.heroWheel": "Tourner la roue",
  "feed.heroTertiary": "Découvrir",
  "feed.recommended": "Recommandé pour vous",
  "feed.recommendedLead":
    "Sélection calculée à partir de tes goûts, de la note moyenne et de la proximité.",
  "reco.badge": "Pour vous",
  "reco.profileTitle": "Suggestions pour toi",
  "reco.reason.likedCountry": "Parce que tu aimes {country}",
  "reco.reason.likedContinent": "Même continent que tes favoris",
  "reco.reason.top_rated": "Très bien noté",
  "reco.reason.new_for_you": "Nouveau pour toi",
  "reco.reason.popular": "Populaire dans le cercle",
  "reco.reason.spotlight": "Coup de projecteur",
  "spotlight.badge": "Pépites locales",
  "spotlight.title": "Coup de projecteur",
  "spotlight.lead":
    "Restaurants moins connus mis en avant — offre payante, clairement identifiée.",
  "spotlight.sponsored": "Sponsorisé",
  "spotlight.cta.eyebrow": "Restaurateurs",
  "spotlight.cta.title": "Boostez votre visibilité",
  "spotlight.cta.teaser": "Idéal pour les adresses encore peu découvertes à Nantes.",
  "spotlight.cta.body":
    "Le coup de projecteur aide les restaurants moins connus à apparaître en tête du feed, dans les recommandations et la recherche avancée. Réservé aux établissements avec peu d'avis dans le cercle.",
  "spotlight.cta.benefit1": "Section dédiée sur l'accueil",
  "spotlight.cta.benefit2": "Priorité dans les recommandations",
  "spotlight.cta.benefit3": "Badge « Sponsorisé » transparent",
  "spotlight.cta.benefit4": "Formule standard ou premium",
  "spotlight.cta.disclaimer":
    "Contenu sponsorisé clairement signalé. Activation après validation du paiement.",
  "spotlight.cta.contact": "Demander un devis",
  "spotlight.cta.mailBody":
    "Bonjour,\n\nJe souhaite activer un coup de projecteur pour mon restaurant à Nantes.\n\nNom du restaurant :\nAdresse :\nFormule souhaitée (standard / premium) :\n\nMerci !",
  "feed.filters": "Filtres",
  "feed.filter.all": "Tous",
  "feed.filter.cuisine": "Cuisine / pays",
  "feed.filter.top": "Top notés",
  "feed.filter.reviews": "Avec avis",
  "feed.filter.website": "Site web",
  "feed.filter.nearby": "Près de moi",
  "feed.filter.reset": "Réinitialiser",
  "feed.empty": "Aucun restaurant pour l'instant",
  "feed.loadMore": "Charger plus",
  "feed.clearFilter": "Filtre : {cuisine}",
  "feed.loadingMore": "Chargement…",
  "explorer.lead":
    "Combine plusieurs mots-clés, continents et critères pour affiner ta sélection.",
  "explorer.searchPlaceholder": "Nom, adresse, cuisine, téléphone…",
  "explorer.minRating": "Note min.",
  "explorer.sort": "Tri",
  "explorer.sort.newest": "Nouveautés",
  "explorer.results": "{count} restaurant(s)",
  "explorer.activeFilters": "{count} filtre(s) actif(s)",
  "explorer.filter.phone": "Avec téléphone",
  "explorer.filter.nearby": "À moins de {km} km",
  "explorer.locationDenied":
    "Active la géolocalisation pour filtrer les restaurants à proximité.",
  "explorer.locationUnavailable":
    "La géolocalisation n'est pas disponible sur cet appareil.",
  "explorer.empty": "Aucun restaurant ne correspond à ces critères.",
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
  "profile.edit": "Modifier le profil",
  "profile.cancelEdit": "Annuler",
  "profile.save": "Enregistrer",
  "profile.saveError": "Impossible de sauvegarder le profil",
  "profile.logout": "Déconnexion",
  "profile.field.username": "Pseudo",
  "profile.field.email": "Email",
  "profile.field.avatar": "Photo",
  "profile.avatar.choose": "Choisir une photo",
  "profile.avatar.uploading": "Envoi en cours…",
  "profile.avatar.hint": "JPG, PNG ou GIF · optimisé automatiquement · max 20 Mo",
  "profile.avatar.drop": "Ou glisse-dépose ta photo ici (contourne le bug Windows)",
  "profile.avatar.onedrive": "Si « Ouvrir » est grisé : clic droit sur le fichier → « Toujours conserver sur cet appareil » (OneDrive).",
  "profile.avatar.error": "Impossible d'envoyer la photo",
  "profile.avatar.notLoggedIn": "Connecte-toi pour changer ta photo",
  "profile.field.bio": "Bio",
  "profile.excludedTitle": "Pays exclus de la roue",
  "profile.excludedLead": "Réactive un pays pour qu'il puisse retomber sur la roue.",
  // Share
  "continent.label": "Continent",
  "continent.all": "Tous les continents",
  "continent.europe": "Europe",
  "continent.africa": "Afrique",
  "continent.asia": "Asie",
  "continent.middle_east": "Moyen-Orient",
  "continent.americas": "Amériques",
  "continent.oceania": "Océanie",
  "continent.other": "Autre",
  "share.title": "Partager",
  "share.close": "Fermer",
  "share.native": "Partager",
  "share.copy": "Copier le lien",
  "share.copied": "Copié !",
  "share.sms": "Message",
  "share.snap": "Snapchat",
  "share.message": "Découvre {app} — le cercle des explorateurs culinaires à Nantes",
  // Exclude
  "exclude.title": "Exclure ce pays ?",
  "exclude.lead": "Tu as noté un resto {country}. Veux-tu griser ce pays sur la roue pour ne plus retomber dessus ?",
  "exclude.confirm": "Oui, exclure",
  "exclude.dismiss": "Non merci",
  // Wheel
  "wheel.title": "Atlas Destiny",
  "wheel.subtitle": "La roue choisit ta cuisine",
  "wheel.direction": "Direction",
  "wheel.spin": "Tourner la roue",
  "wheel.tap": "Appuyer pour tourner",
  "wheel.spinning": "Sélection...",
  "wheel.resultsTitle": "Restaurants pour {country}",
  "wheel.resultsLead": "La roue a choisi {country}. Voici les restaurants correspondants.",
  "wheel.resultsCount": "{count} restaurant(s) trouvé(s)",
  "wheel.back": "Retour à la roue",
  "wheel.empty": "Aucun restaurant trouvé pour ce pays",
  "wheel.allExcluded": "Tous les pays sont exclus — réactive-en depuis ton profil",
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
  "map.location": "Me localiser",
  "map.distance": "Distance max",
  "map.popularity": "Popularité",
  "map.nearby": "Autour de moi",
  "map.filters": "Filtres carte",
  "map.radius": "Rayon",
  "map.skin": "Skin carte",
  "map.reset": "Réinitialiser",
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
  "admin.new": "Nouveau restaurant",
  "admin.newTitle": "Ajouter un restaurant",
  "admin.create": "Créer",
  "admin.cancel": "Fermer",
  "admin.saved": "Modifications enregistrées",
  "admin.created": "Restaurant créé",
  "admin.activated": "Restaurant activé",
  "admin.deactivated": "Restaurant désactivé",
  "admin.empty": "Aucun restaurant trouvé",
  "admin.filter.allCuisines": "Toutes les cuisines",
  "admin.stats.total": "Total",
  "admin.stats.active": "Actifs",
  "admin.stats.inactive": "Inactifs",
  "admin.status.active": "Actif",
  "admin.status.inactive": "Inactif",
  "admin.col.name": "Nom",
  "admin.col.cuisine": "Cuisine",
  "admin.col.address": "Adresse",
  "admin.col.phone": "Téléphone",
  "admin.col.actions": "Actions",
  "admin.ph.name": "Nom",
  "admin.ph.city": "Ville",
  "admin.ph.website": "Site web",
  "admin.ph.rating": "Note",
  "admin.ph.latitude": "Latitude",
  "admin.ph.longitude": "Longitude",
  "admin.error.load": "Erreur de chargement",
  "admin.error.save": "Erreur d'enregistrement",
  "admin.error.create": "Erreur de création",
  "admin.error.toggle": "Erreur de changement de statut",
  "admin.error.nameRequired": "Le nom est obligatoire",
  "admin.boost.title": "Coup de projecteur (payant)",
  "admin.boost.standard30": "Standard 30 j",
  "admin.boost.premium30": "Premium 30 j",
  "admin.boost.stop": "Arrêter le boost",
  "admin.boost.added": "Boost activé",
  "admin.boost.removed": "Boost désactivé",
  "admin.boost.error": "Erreur boost",
  "admin.boost.until": "Jusqu'au {date}",
  "admin.boost.tier": "Niveau {tier}",
  "admin.migrate.hint":
    "Applique la migration SQL boost_until / boost_tier si elle n'est pas encore sur Supabase.",
  "admin.migrate.run": "Lancer la migration boost",
  "admin.migrate.running": "Migration…",
  "admin.migrate.ok": "Migration OK — colonnes : {columns}",
  "admin.migrate.error": "Échec de la migration",
  "admin.promote.title": "Promouvoir un admin",
  "admin.promote.hint":
    "Le compte doit déjà exister (inscription préalable). Le rôle est appliqué immédiatement.",
  "admin.promote.placeholder": "email@exemple.com",
  "admin.promote.run": "Rendre admin",
  "admin.promote.running": "Promotion…",
  "admin.promote.ok": "{email} est maintenant administrateur",
  "admin.promote.error": "Promotion impossible",
  "admin.promote.errorEmail": "Indique un email valide",
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
  "nav.spin": "Explore",
  "nav.wheel": "Wheel",
  "nav.ai": "AI",
  "nav.you": "You",
  "nav.home": "Home / Wheel",
  "nav.admin": "Back-office",
  "nav.return": "Return",
  "nav.preferences": "Preferences",
  "nav.account": "Account",
  "auth.tagline": "Verified Access Only",
  "auth.name": "NAME",
  "auth.email": "EMAIL",
  "auth.password": "PASSWORD",
  "auth.enter": "Enter",
  "auth.join": "Join",
  "auth.toLogin": "Return to Login",
  "auth.toJoin": "New Membership",
  "auth.logout": "Log out",
  "auth.error": "Login error",
  "setup.title": "Setup required",
  "setup.intro":
    "Supabase variables are missing. Create web/.env.local from web/.env.example, fill in your keys, then restart the dev server.",
  "setup.hint": "Keys are in Supabase → Project Settings → API.",
  "feed.search": "Search...",
  "feed.heroTitle": "Find your next spot in seconds.",
  "feed.heroLead":
    "Fast search, nearby map and personalized recommendations to get straight to the point.",
  "feed.heroPrimary": "Advanced search",
  "feed.heroSecondary": "Open map",
  "feed.heroWheel": "Spin wheel",
  "feed.heroTertiary": "Discover",
  "feed.recommended": "Recommended for you",
  "feed.recommendedLead":
    "Selection computed from your tastes, average rating and proximity.",
  "reco.badge": "For you",
  "reco.profileTitle": "Suggestions for you",
  "reco.reason.likedCountry": "Because you like {country}",
  "reco.reason.likedContinent": "Same region as your favorites",
  "reco.reason.top_rated": "Highly rated",
  "reco.reason.new_for_you": "New for you",
  "reco.reason.popular": "Popular in the circle",
  "reco.reason.spotlight": "Spotlight",
  "spotlight.badge": "Local gems",
  "spotlight.title": "Spotlight",
  "spotlight.lead":
    "Lesser-known restaurants featured — paid placement, clearly labeled.",
  "spotlight.sponsored": "Sponsored",
  "spotlight.cta.eyebrow": "Restaurant owners",
  "spotlight.cta.title": "Boost your visibility",
  "spotlight.cta.teaser": "Ideal for addresses still under the radar in Nantes.",
  "spotlight.cta.body":
    "Spotlight helps lesser-known restaurants appear at the top of the feed, recommendations and advanced search. Reserved for venues with few circle reviews.",
  "spotlight.cta.benefit1": "Dedicated home section",
  "spotlight.cta.benefit2": "Priority in recommendations",
  "spotlight.cta.benefit3": "Transparent « Sponsored » badge",
  "spotlight.cta.benefit4": "Standard or premium plan",
  "spotlight.cta.disclaimer":
    "Sponsored content is clearly disclosed. Activation after payment confirmation.",
  "spotlight.cta.contact": "Request a quote",
  "spotlight.cta.mailBody":
    "Hello,\n\nI would like to activate a spotlight for my restaurant in Nantes.\n\nRestaurant name:\nAddress:\nPreferred plan (standard / premium):\n\nThank you!",
  "feed.filters": "Filters",
  "feed.filter.all": "All",
  "feed.filter.cuisine": "Cuisine / country",
  "feed.filter.top": "Top rated",
  "feed.filter.reviews": "With reviews",
  "feed.filter.website": "Website",
  "feed.filter.nearby": "Nearby",
  "feed.filter.reset": "Reset",
  "feed.empty": "No restaurants yet",
  "feed.loadMore": "Load more",
  "feed.clearFilter": "Filter: {cuisine}",
  "feed.loadingMore": "Loading…",
  "explorer.lead":
    "Combine keywords, continents and criteria to narrow your selection.",
  "explorer.searchPlaceholder": "Name, address, cuisine, phone…",
  "explorer.minRating": "Min. rating",
  "explorer.sort": "Sort",
  "explorer.sort.newest": "Newest",
  "explorer.results": "{count} restaurant(s)",
  "explorer.activeFilters": "{count} active filter(s)",
  "explorer.filter.phone": "With phone",
  "explorer.filter.nearby": "Within {km} km",
  "explorer.locationDenied":
    "Enable location to filter nearby restaurants.",
  "explorer.locationUnavailable":
    "Location is not available on this device.",
  "explorer.empty": "No restaurants match these criteria.",
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
  "profile.edit": "Edit profile",
  "profile.cancelEdit": "Cancel",
  "profile.save": "Save",
  "profile.saveError": "Could not save profile",
  "profile.logout": "Log out",
  "profile.field.username": "Username",
  "profile.field.email": "Email",
  "profile.field.avatar": "Photo",
  "profile.avatar.choose": "Choose photo",
  "profile.avatar.uploading": "Uploading…",
  "profile.avatar.hint": "JPG, PNG or GIF · auto-optimized · max 20 MB",
  "profile.avatar.drop": "Or drag & drop your photo here (bypasses Windows picker bug)",
  "profile.avatar.onedrive": "If Open is greyed out: right-click file → « Always keep on this device » (OneDrive).",
  "profile.avatar.error": "Could not upload photo",
  "profile.avatar.notLoggedIn": "Sign in to change your photo",
  "profile.field.bio": "Bio",
  "profile.excludedTitle": "Countries excluded from wheel",
  "profile.excludedLead": "Re-enable a country so it can appear on the wheel again.",
  "continent.label": "Continent",
  "continent.all": "All continents",
  "continent.europe": "Europe",
  "continent.africa": "Africa",
  "continent.asia": "Asia",
  "continent.middle_east": "Middle East",
  "continent.americas": "Americas",
  "continent.oceania": "Oceania",
  "continent.other": "Other",
  "share.title": "Share",
  "share.close": "Close",
  "share.native": "Share",
  "share.copy": "Copy link",
  "share.copied": "Copied!",
  "share.sms": "Message",
  "share.snap": "Snapchat",
  "share.message": "Discover {app} — Nantes world cuisine explorers",
  "exclude.title": "Exclude this country?",
  "exclude.lead": "You rated a {country} restaurant. Gray it out on the wheel so you won't land on it again?",
  "exclude.confirm": "Yes, exclude",
  "exclude.dismiss": "No thanks",
  "wheel.title": "Atlas Destiny",
  "wheel.subtitle": "The wheel picks your cuisine",
  "wheel.direction": "Heading to",
  "wheel.spin": "Spin the wheel",
  "wheel.tap": "Tap to spin",
  "wheel.spinning": "Selecting...",
  "wheel.resultsTitle": "Restaurants in {country}",
  "wheel.resultsLead": "The wheel picked {country}. Here are the matching restaurants.",
  "wheel.resultsCount": "{count} restaurant(s) found",
  "wheel.back": "Back to wheel",
  "wheel.empty": "No restaurants found for this country",
  "wheel.allExcluded": "All countries excluded — re-enable some in your profile",
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
  "map.location": "Use my location",
  "map.distance": "Max distance",
  "map.popularity": "Popularity",
  "map.nearby": "Near me",
  "map.filters": "Map filters",
  "map.radius": "Radius",
  "map.skin": "Map skin",
  "map.reset": "Reset",
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
  "admin.new": "New restaurant",
  "admin.newTitle": "Add a restaurant",
  "admin.create": "Create",
  "admin.cancel": "Close",
  "admin.saved": "Changes saved",
  "admin.created": "Restaurant created",
  "admin.activated": "Restaurant activated",
  "admin.deactivated": "Restaurant deactivated",
  "admin.empty": "No restaurants found",
  "admin.filter.allCuisines": "All cuisines",
  "admin.stats.total": "Total",
  "admin.stats.active": "Active",
  "admin.stats.inactive": "Inactive",
  "admin.status.active": "Active",
  "admin.status.inactive": "Inactive",
  "admin.col.name": "Name",
  "admin.col.cuisine": "Cuisine",
  "admin.col.address": "Address",
  "admin.col.phone": "Phone",
  "admin.col.actions": "Actions",
  "admin.ph.name": "Name",
  "admin.ph.city": "City",
  "admin.ph.website": "Website",
  "admin.ph.rating": "Rating",
  "admin.ph.latitude": "Latitude",
  "admin.ph.longitude": "Longitude",
  "admin.error.load": "Load error",
  "admin.error.save": "Save error",
  "admin.error.create": "Create error",
  "admin.error.toggle": "Status change error",
  "admin.error.nameRequired": "Name is required",
  "admin.boost.title": "Spotlight (paid)",
  "admin.boost.standard30": "Standard 30d",
  "admin.boost.premium30": "Premium 30d",
  "admin.boost.stop": "Stop boost",
  "admin.boost.added": "Boost activated",
  "admin.boost.removed": "Boost deactivated",
  "admin.boost.error": "Boost error",
  "admin.boost.until": "Until {date}",
  "admin.boost.tier": "Tier {tier}",
  "admin.migrate.hint":
    "Apply the boost_until / boost_tier SQL migration if not yet on Supabase.",
  "admin.migrate.run": "Run boost migration",
  "admin.migrate.running": "Migrating…",
  "admin.migrate.ok": "Migration OK — columns: {columns}",
  "admin.migrate.error": "Migration failed",
  "admin.promote.title": "Promote an admin",
  "admin.promote.hint":
    "The account must already exist (signed up first). Role is applied immediately.",
  "admin.promote.placeholder": "email@example.com",
  "admin.promote.run": "Make admin",
  "admin.promote.running": "Promoting…",
  "admin.promote.ok": "{email} is now an administrator",
  "admin.promote.error": "Could not promote user",
  "admin.promote.errorEmail": "Enter a valid email",
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
