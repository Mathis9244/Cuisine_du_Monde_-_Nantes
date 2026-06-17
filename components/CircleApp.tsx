"use client";

import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  ArrowLeft,
  Shield,
  X,
  LogIn,
  Menu,
  SlidersHorizontal,
  Share2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { MapFilters, Restaurant } from "@/lib/types";
import { fetchRestaurants, fetchRestaurant } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import { countryToCuisine } from "@/lib/mappers";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  useAppUIState,
  useAuth,
  useFeaturedRestaurants,
  useWheelCountries,
  useRestaurantStats,
  useExplorerPreferences,
  useMapFilters,
  ViewMode,
  FeedFilter,
  ExplorerSort,
} from "@/hooks";
import {
  scoreRestaurantForRecommendations,
  filterRestaurantsByFeedFilter,
  filterExplorerResults,
  filterMapRestaurants,
} from "@/lib/restaurantFilters";
import HomeHero from "./HomeHero";
import RestaurantList from "./RestaurantList";
import StarRating from "./StarRating";
import GooeyNav from "./GooeyNav";
import WheelOfFortune from "./WheelOfFortune";
import WheelCountryView from "./WheelCountryView";
import ProfileView from "./ProfileView";
import ShareSheet from "./ShareSheet";
import ExcludeCountryPrompt from "./ExcludeCountryPrompt";
import AIResearch from "./AIResearch";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";
import { RestaurantListSkeleton } from "./RestaurantCardSkeleton";
import {
  addExcludedCountry,
  getExcludedCountries,
  getRatedRestaurantIds,
  removeExcludedCountry,
} from "@/lib/userStore";

function MapLoadingFallback() {
  const { t } = useI18n();
  return (
    <p className="text-center text-circle-frost/30 font-black uppercase tracking-[0.4em] py-24">
      {t("map.loading")}
    </p>
  );
}

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

const MDiv = motion.div as any;

const avatarFor = (username: string) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

function resolveAvatar(
  username: string,
  metadata?: Record<string, unknown>,
): string {
  const custom = metadata?.avatar_url;
  if (typeof custom === "string" && custom.trim()) return custom.trim();
  return avatarFor(username);
}

const CircleApp: React.FC = () => {
  const { t } = useI18n();

  // UI State
  const {
    state,
    setCurrentView,
    setRatingTarget,
    setViewAllCountry,
    setWheelCountry,
    setAuthOpen,
    setAuthMode,
    setMobileNavOpen,
    setFeedFilter,
    setFeedSearchDraft,
    setFeedSearchQuery,
    setExplorerSearchDraft,
    setExplorerSearchQuery,
    setTargetProfile,
  } = useAppUIState();

  // Authentication
  const { user, logout, updateUser } = useAuth();

  // Data fetching hooks
  const { restaurants: featuredRestaurants, loading: featuredLoading } =
    useFeaturedRestaurants();
  const { countries: wheelCountries, loading: wheelLoading } =
    useWheelCountries();
  const restaurantStats = useRestaurantStats();
  const {
    prefs: explorerPrefs,
    updatePrefs: updateExplorerPrefs,
    reset: resetExplorerPrefs,
  } = useExplorerPreferences();
  const { filters: mapFilters, updateFilters: updateMapFilters } =
    useMapFilters();

  // Feed restaurants
  const [feedRestaurants, setFeedRestaurants] = useState<Restaurant[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotalPages, setFeedTotalPages] = useState(1);
  const loadFeedReqId = useRef(0);

  // Explorer/Spin view
  const [explorerRestaurants, setExplorerRestaurants] = useState<Restaurant[]>(
    [],
  );
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerError, setExplorerError] = useState<string | null>(null);

  // Wheel result
  const [wheelCountryRestaurants, setWheelCountryRestaurants] = useState<
    Restaurant[]
  >([]);
  const [wheelCountryLoading, setWheelCountryLoading] = useState(false);
  const [wheelCountryError, setWheelCountryError] = useState<string | null>(
    null,
  );
  const loadWheelCountryReqId = useRef(0);

  // Map view
  const [mapRestaurants, setMapRestaurants] = useState<Restaurant[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // Auth modal
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [shareOpen, setShareOpen] = useState(false);
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [excludePromptOpen, setExcludePromptOpen] = useState(false);
  const [excludePromptCountry, setExcludePromptCountry] = useState<string | null>(
    null,
  );
  const [profileRestaurants, setProfileRestaurants] = useState<Restaurant[]>([]);
  const [profileRestaurantsLoading, setProfileRestaurantsLoading] =
    useState(false);

  // Load feed restaurants
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setFeedPage(1);

    const loadFeed = async () => {
      const reqId = ++loadFeedReqId.current;
      setFeedLoading(true);
      setFeedError(null);

      try {
        const cuisineFilter = state.viewAllCountry
          ? countryToCuisine(state.viewAllCountry)
          : undefined;

        const res = await fetchRestaurants({
          page: 1,
          limit: 20,
          search: state.feedSearchQuery || undefined,
          cuisine: cuisineFilter,
          sortBy: "name",
          sortOrder: "asc",
        });

        if (reqId === loadFeedReqId.current) {
          setFeedTotalPages(res.meta.totalPages);
          setFeedRestaurants(res.data);
        }
      } catch (err) {
        if (reqId === loadFeedReqId.current) {
          setFeedError(
            err instanceof Error ? err.message : "Erreur de chargement",
          );
        }
      } finally {
        if (reqId === loadFeedReqId.current) {
          setFeedLoading(false);
        }
      }
    };

    void loadFeed();
  }, [state.feedSearchQuery, state.viewAllCountry]);

  // Load explorer restaurants
  useEffect(() => {
    if (!isSupabaseConfigured() || state.currentView !== "spin") return;
    let active = true;
    setExplorerLoading(true);
    setExplorerError(null);

    fetchRestaurants({ limit: 100, sortBy: "rating", sortOrder: "desc" })
      .then((res) => {
        if (active) setExplorerRestaurants(res.data);
      })
      .catch((err) => {
        if (active) {
          setExplorerError(
            err instanceof Error ? err.message : "Erreur de chargement",
          );
        }
      })
      .finally(() => {
        if (active) setExplorerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [state.currentView]);

  // Load wheel country restaurants
  useEffect(() => {
    if (
      !isSupabaseConfigured() ||
      state.currentView !== "wheel-result" ||
      !state.wheelCountry
    )
      return;

    let active = true;
    const reqId = ++loadWheelCountryReqId.current;
    setWheelCountryLoading(true);
    setWheelCountryError(null);

    fetchRestaurants({
      limit: 100,
      cuisine: countryToCuisine(state.wheelCountry),
      sortBy: "rating",
      sortOrder: "desc",
    })
      .then((res) => {
        if (active && reqId === loadWheelCountryReqId.current) {
          setWheelCountryRestaurants(res.data);
        }
      })
      .catch((err) => {
        if (active && reqId === loadWheelCountryReqId.current) {
          setWheelCountryError(
            err instanceof Error ? err.message : "Erreur de chargement",
          );
        }
      })
      .finally(() => {
        if (active && reqId === loadWheelCountryReqId.current) {
          setWheelCountryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [state.currentView, state.wheelCountry]);

  // Load map restaurants
  useEffect(() => {
    if (state.currentView !== "map") return;
    let active = true;
    setMapLoading(true);

    fetchRestaurants({ limit: 200, sortBy: "name", sortOrder: "asc" })
      .then((res) => {
        if (active) setMapRestaurants(res.data);
      })
      .catch(() => {
        if (active) setMapRestaurants([]);
      })
      .finally(() => {
        if (active) setMapLoading(false);
      });

    return () => {
      active = false;
    };
  }, [state.currentView]);

  useEffect(() => {
    if (!user) {
      setExcludedCountries([]);
      return;
    }
    setExcludedCountries(getExcludedCountries(user.id));
  }, [user]);

  useEffect(() => {
    if (
      state.currentView !== "profile" ||
      !user ||
      !state.targetProfile ||
      state.targetProfile.name !== user.username
    ) {
      return;
    }

    let active = true;
    setProfileRestaurantsLoading(true);
    const ids = getRatedRestaurantIds();

    if (ids.length === 0) {
      setProfileRestaurants([]);
      setProfileRestaurantsLoading(false);
      return () => {
        active = false;
      };
    }

    void Promise.allSettled(ids.map((id) => fetchRestaurant(id)))
      .then((results) => {
        if (!active) return;
        const loaded = results
          .filter(
            (r): r is PromiseFulfilledResult<Restaurant> =>
              r.status === "fulfilled",
          )
          .map((r) => r.value);
        setProfileRestaurants(loaded);
      })
      .finally(() => {
        if (active) setProfileRestaurantsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [state.currentView, user, state.targetProfile]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (state.ratingTarget) setRatingTarget(null);
      if (state.authOpen) setAuthOpen(false);
      else if (shareOpen) setShareOpen(false);
      else if (excludePromptOpen) {
        setExcludePromptOpen(false);
        setExcludePromptCountry(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.ratingTarget, state.authOpen, shareOpen, excludePromptOpen]);

  // Mobile nav scroll lock
  useEffect(() => {
    if (!state.mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state.mobileNavOpen]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.currentView, state.viewAllCountry, state.wheelCountry]);

  // Handlers
  const handleLogout = useCallback(() => {
    logout();
    setCurrentView("feed");
    setViewAllCountry(null);
  }, [logout]);

  const handleRateSuccess = useCallback(
    (restaurantId: string, rating: number) => {
      const update = (list: Restaurant[]) =>
        list.map((res) => (res.id === restaurantId ? { ...res, rating } : res));
      setFeedRestaurants(update);
      setExplorerRestaurants(update);
      setWheelCountryRestaurants(update);
      setMapRestaurants(update);
      setProfileRestaurants(update);
    },
    [],
  );

  const handleConfirmExclude = useCallback(() => {
    if (!user || !excludePromptCountry) return;
    setExcludedCountries(addExcludedCountry(user.id, excludePromptCountry));
    setExcludePromptOpen(false);
    setExcludePromptCountry(null);
  }, [user, excludePromptCountry]);

  const handleToggleExcludedCountry = useCallback(
    (country: string, excluded: boolean) => {
      if (!user) return;
      const next = excluded
        ? addExcludedCountry(user.id, country)
        : removeExcludedCountry(user.id, country);
      setExcludedCountries(next);
    },
    [user],
  );

  const handleProfileUpdate = useCallback(
    (next: {
      name: string;
      avatar: string;
      email?: string;
      bio?: string;
    }) => {
      updateUser({
        username: next.name,
        email: next.email,
        bio: next.bio ?? "",
        avatarUrl: next.avatar,
      });
      setTargetProfile({ name: next.name, avatar: next.avatar });
    },
    [updateUser, setTargetProfile],
  );

  const requireAuth = useCallback(
    (action: () => void) => {
      if (!user) {
        setAuthOpen(true);
        return;
      }
      action();
    },
    [user],
  );

  const handleRateRequest = useCallback(
    (restaurant: Restaurant) => {
      requireAuth(() => setRatingTarget(restaurant));
    },
    [requireAuth],
  );

  const handleNav = useCallback(
    (index: number) => {
      setViewAllCountry(null);
      setTargetProfile(null);
      if (index === 0) {
        setCurrentView("feed");
      } else if (index === 1) {
        setCurrentView("map");
      } else if (index === 2) {
        setCurrentView("spin");
      } else if (index === 3) {
        setCurrentView("wheel");
      } else if (index === 4) {
        setCurrentView("ai");
      } else if (index === 5) {
        requireAuth(() => {
          setTargetProfile({
            name: user!.username,
            avatar: user!.avatarUrl,
          });
          setCurrentView("profile");
        });
      }
    },
    [user, requireAuth],
  );

  const handleCountrySelect = useCallback((country: string) => {
    setViewAllCountry(country);
    setCurrentView("feed");
    setTimeout(() => {
      document.getElementById("explore")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 150);
  }, []);

  const handleWheelResult = useCallback((country: string) => {
    setViewAllCountry(null);
    setWheelCountry(country);
    setCurrentView("wheel-result");
  }, []);

  const handleProfileView = useCallback(
    (profile: { name: string; avatar: string }) => {
      requireAuth(() => {
        setTargetProfile(profile);
        setCurrentView("profile");
      });
    },
    [requireAuth],
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      if (state.authMode === "join") {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: { username: authForm.username } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
      }
      setAuthForm({ email: "", password: "", username: "" });
      setAuthOpen(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setAuthLoading(false);
    }
  };

  // Computed values
  const countries = wheelCountries.length
    ? wheelCountries
    : Array.from(new Set(feedRestaurants.map((r) => r.country))).sort();

  const cuisineOptions = useMemo(
    () =>
      Array.from(
        new Set([...countries, ...featuredRestaurants.map((r) => r.country)]),
      ).sort(),
    [countries, featuredRestaurants],
  );

  const filteredRestaurants = useMemo(
    () => filterRestaurantsByFeedFilter(feedRestaurants, state.feedFilter),
    [state.feedFilter, feedRestaurants],
  );

  const hideRecommendedSection =
    Boolean(state.feedSearchQuery.trim()) ||
    state.feedFilter !== "all" ||
    Boolean(state.viewAllCountry);

  const favoriteCountries = useMemo(() => {
    const matches = featuredRestaurants.filter(
      (restaurant) => (restaurant.rating ?? 0) >= 4.2,
    );
    return new Set(matches.map((restaurant) => restaurant.country));
  }, [featuredRestaurants]);

  const recommendedRestaurants = useMemo(() => {
    const pool =
      featuredRestaurants.length > 0 ? featuredRestaurants : feedRestaurants;
    return [...pool]
      .sort(
        (a, b) =>
          scoreRestaurantForRecommendations(b, { favoriteCountries }) -
          scoreRestaurantForRecommendations(a, { favoriteCountries }),
      )
      .slice(0, 6);
  }, [favoriteCountries, featuredRestaurants, feedRestaurants]);

  const explorerResults = useMemo(
    () =>
      filterExplorerResults(
        explorerRestaurants.length > 0
          ? explorerRestaurants
          : featuredRestaurants,
        state.explorerSearchQuery,
        explorerPrefs,
        favoriteCountries,
      ),
    [
      state.explorerSearchQuery,
      explorerPrefs,
      explorerRestaurants,
      featuredRestaurants,
      favoriteCountries,
    ],
  );

  const mapDisplayRestaurants = useMemo(
    () => filterMapRestaurants(mapRestaurants, mapFilters, favoriteCountries),
    [favoriteCountries, mapFilters, mapRestaurants],
  );

  const initialFeedLoading = feedLoading && feedRestaurants.length === 0;
  const canLoadMore = feedPage < feedTotalPages;

  const handleLoadMore = useCallback(async () => {
    if (feedLoading || feedLoadingMore || !canLoadMore) return;
    const nextPage = feedPage + 1;
    setFeedPage(nextPage);

    const reqId = ++loadFeedReqId.current;
    setFeedLoadingMore(true);

    try {
      const cuisineFilter = state.viewAllCountry
        ? countryToCuisine(state.viewAllCountry)
        : undefined;

      const res = await fetchRestaurants({
        page: nextPage,
        limit: 20,
        search: state.feedSearchQuery || undefined,
        cuisine: cuisineFilter,
        sortBy: "name",
        sortOrder: "asc",
      });

      if (reqId === loadFeedReqId.current) {
        setFeedRestaurants((prev) => [...prev, ...res.data]);
      }
    } finally {
      if (reqId === loadFeedReqId.current) {
        setFeedLoadingMore(false);
      }
    }
  }, [
    feedLoading,
    feedLoadingMore,
    canLoadMore,
    feedPage,
    state.viewAllCountry,
    state.feedSearchQuery,
  ]);

  const isAtHome = state.currentView === "feed" && !state.viewAllCountry;

  const authFormContent = (
    <form onSubmit={handleLogin} className="space-y-6">
      {authError && (
        <div className="px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-200 text-xs font-bold tracking-widest">
          {authError}
        </div>
      )}
      {state.authMode === "join" && (
        <input
          required
          type="text"
          placeholder={t("auth.name")}
          value={authForm.username}
          onChange={(e) =>
            setAuthForm({ ...authForm, username: e.target.value })
          }
          className="w-full px-6 py-5 bg-circle-card border border-circle-border rounded-3xl outline-none focus:border-circle-teal text-lg font-bold text-circle-text placeholder-circle-text/20 uppercase tracking-widest"
        />
      )}
      <input
        required
        type="email"
        placeholder={t("auth.email")}
        value={authForm.email}
        onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
        className="w-full px-6 py-5 bg-circle-card border border-circle-border rounded-3xl outline-none focus:border-circle-teal text-lg font-bold text-circle-text placeholder-circle-text/20 uppercase tracking-widest"
      />
      <input
        required
        type="password"
        placeholder={t("auth.password")}
        value={authForm.password}
        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
        className="w-full px-6 py-5 bg-circle-card border border-circle-border rounded-3xl outline-none focus:border-circle-teal text-lg font-bold text-circle-text placeholder-circle-text/20 uppercase tracking-widest"
      />
      <button
        type="submit"
        disabled={authLoading}
        className="w-full bg-circle-amber text-[#081c1b] py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {authLoading
          ? "..."
          : state.authMode === "login"
            ? t("auth.enter")
            : t("auth.join")}
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={() =>
            setAuthMode(state.authMode === "join" ? "login" : "join")
          }
          className="text-[10px] font-black uppercase tracking-[0.4em] text-circle-frost/30 hover:text-circle-text transition-all"
        >
          {state.authMode === "join" ? t("auth.toLogin") : t("auth.toJoin")}
        </button>
      </div>
    </form>
  );

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-circle-bg flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg bg-circle-card border border-circle-border rounded-[2rem] p-10 space-y-6">
          <h1 className="text-3xl font-black text-circle-amber uppercase tracking-tighter">
            {t("setup.title")}
          </h1>
          <p className="text-circle-frost/70 text-sm leading-relaxed">
            {t("setup.intro")}
          </p>
          <pre className="bg-circle-bg border border-circle-border rounded-2xl p-4 text-xs text-circle-frost/80 overflow-x-auto">
            {`NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."`}
          </pre>
          <p className="text-circle-frost/40 text-xs">{t("setup.hint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-circle-bg text-circle-text font-sans selection:bg-circle-amber selection:text-[#081c1b]">
      <nav className="sticky top-0 z-50 bg-circle-bg/85 backdrop-blur-2xl border-b border-circle-border px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
        <div className="flex items-center min-w-[120px] shrink-0">
          {isAtHome ? (
            <div className="cursor-pointer" onClick={() => handleNav(0)}>
              <span className="font-black text-sm md:text-lg uppercase tracking-[0.28em] text-circle-amber">
                {APP_NAME}
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                handleNav(0);
                setViewAllCountry(null);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-circle-text/5 border border-circle-text/10 rounded-xl hover:bg-circle-text/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t("nav.return")}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden lg:flex items-center gap-4">
            <GooeyNav
              key={
                state.currentView === "wheel-result"
                  ? "wheel"
                  : state.currentView
              }
              items={[
                { label: t("nav.feed"), href: "#" },
                { label: t("nav.map"), href: "#" },
                { label: t("nav.spin"), href: "#" },
                { label: t("nav.wheel"), href: "#" },
                { label: t("nav.ai"), href: "#" },
                { label: t("nav.you"), href: "#" },
              ]}
              onNav={handleNav}
              initialActiveIndex={
                state.currentView === "feed"
                  ? 0
                  : state.currentView === "map"
                    ? 1
                    : state.currentView === "spin"
                      ? 2
                      : state.currentView === "wheel"
                        ? 3
                        : state.currentView === "wheel-result"
                          ? 3
                          : state.currentView === "ai"
                            ? 4
                            : 5
              }
            />
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="text-circle-frost/40 hover:text-circle-amber transition-colors p-2"
                title={t("nav.admin")}
              >
                <Shield size={20} />
              </Link>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="text-circle-frost/40 hover:text-circle-amber transition-colors p-2"
              title={t("share.title")}
              aria-label={t("share.title")}
            >
              <Share2 size={20} />
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-circle-frost/40 hover:text-circle-text transition-colors p-2"
                title={t("auth.toLogin")}
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-circle-amber text-[#081c1b] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-circle-honey transition-all"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">{t("auth.enter")}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-circle-border bg-circle-card/80 text-circle-frost/50 hover:text-circle-amber hover:border-circle-amber/60 transition-all"
            aria-label={t("share.title")}
            title={t("share.title")}
          >
            <Share2 size={18} />
          </button>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-circle-border bg-circle-card/80 text-circle-text/80 hover:text-circle-amber hover:border-circle-amber/60 transition-all"
            aria-label={
              state.mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"
            }
            aria-expanded={state.mobileNavOpen}
            onClick={() => setMobileNavOpen(!state.mobileNavOpen)}
          >
            {state.mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {state.mobileNavOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-40 bg-[#041111]/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(88vw,22rem)] rounded-l-[2rem] border-l border-y border-circle-border bg-circle-bg shadow-2xl shadow-black/30 p-5 lg:hidden overflow-y-auto"
              initial={{ x: 32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 32, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between gap-3 pb-5 border-b border-circle-border">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-circle-frost/40 font-black">
                    {APP_NAME}
                  </p>
                  <p className="mt-1 text-sm font-bold text-circle-frost/70">
                    Navigation
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-circle-border bg-circle-card text-circle-text/70"
                  aria-label="Fermer le menu"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {[
                  { label: t("nav.feed"), index: 0 },
                  { label: t("nav.map"), index: 1 },
                  { label: t("nav.spin"), index: 2 },
                  { label: t("nav.wheel"), index: 3 },
                  { label: t("nav.ai"), index: 4 },
                  { label: t("nav.you"), index: 5 },
                ].map((item) => {
                  const active =
                    (item.index === 0 && state.currentView === "feed") ||
                    (item.index === 1 && state.currentView === "map") ||
                    (item.index === 2 && state.currentView === "spin") ||
                    (item.index === 3 &&
                      (state.currentView === "wheel" ||
                        state.currentView === "wheel-result")) ||
                    (item.index === 4 && state.currentView === "ai") ||
                    (item.index === 5 && state.currentView === "profile");

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        handleNav(item.index);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all ${
                        active
                          ? "border-circle-amber/60 bg-circle-amber/10 text-circle-amber"
                          : "border-circle-border bg-circle-card/70 text-circle-text/80 hover:border-circle-frost/30 hover:bg-circle-card"
                      }`}
                    >
                      <span className="text-sm font-black uppercase tracking-[0.28em]">
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.35em] text-circle-frost/40">
                        {active ? "Current" : "Open"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-circle-border bg-circle-card/70 p-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-circle-frost/40 font-black">
                    Tools
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <LanguageToggle />
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={() => {
                        setShareOpen(true);
                        setMobileNavOpen(false);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-circle-border bg-circle-bg/70 text-circle-frost/60"
                      aria-label={t("share.title")}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-circle-border bg-circle-card/70 p-3 flex min-h-[10rem] flex-col justify-center gap-2">
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-center gap-2 rounded-xl border border-circle-border bg-circle-bg/70 px-3 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/70"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Shield size={14} />
                      Admin
                    </Link>
                  )}
                  {user ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileNavOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-circle-text px-3 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-circle-bg"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthOpen(true);
                        setMobileNavOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-circle-amber px-3 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#081c1b]"
                    >
                      <LogIn size={14} />
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="container mx-auto max-w-5xl pt-8 md:pt-16 pb-24 md:pb-32 px-4 md:px-8">
        <AnimatePresence mode="wait" initial={false}>
          {state.currentView === "feed" && (
            <MDiv
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-20 md:space-y-32"
            >
              {!state.viewAllCountry && (
                <>
                  <HomeHero
                    totalRestaurants={
                      restaurantStats?.total ??
                      featuredRestaurants.length ??
                      feedRestaurants.length
                    }
                    recommendedCount={recommendedRestaurants.length}
                    cuisineCount={
                      restaurantStats?.byCuisine.length ?? countries.length
                    }
                    onOpenExplorer={() => setCurrentView("spin")}
                    onOpenWheel={() => setCurrentView("wheel")}
                    onOpenMap={() => setCurrentView("map")}
                    onJumpToSearch={() =>
                      document.getElementById("explore")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                  />
                  <div className="border-t border-circle-border" />
                </>
              )}

              <div className="space-y-12">
                <div className="max-w-3xl mx-auto pt-4">
                  <div className="relative group">
                    <Search
                      className="absolute left-8 top-1/2 -translate-y-1/2 text-circle-teal/40"
                      size={24}
                    />
                    <input
                      type="text"
                      placeholder={t("feed.search")}
                      value={state.feedSearchDraft}
                      onChange={(e) => setFeedSearchDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setFeedSearchQuery(state.feedSearchDraft.trim());
                        }
                      }}
                      className="w-full pl-20 pr-32 py-8 bg-circle-card border border-circle-border rounded-[2.5rem] focus:border-circle-teal transition-all text-2xl font-black text-circle-text placeholder-circle-frost/10 uppercase tracking-widest outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFeedSearchQuery(state.feedSearchDraft.trim())
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-circle-border bg-circle-bg/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-circle-text/70 hover:text-circle-amber transition-colors"
                    >
                      Go
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                      <SlidersHorizontal size={14} />
                      <span>{t("feed.filters")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "all", label: t("feed.filter.all") },
                        { key: "top", label: t("feed.filter.top") },
                        { key: "reviews", label: t("feed.filter.reviews") },
                        { key: "website", label: t("feed.filter.website") },
                      ].map((item) => {
                        const active = state.feedFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() =>
                              setFeedFilter(item.key as FeedFilter)
                            }
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                              active
                                ? "border-circle-amber/50 bg-circle-amber text-[#081c1b]"
                                : "border-circle-border bg-circle-card/70 text-circle-frost/60 hover:text-circle-text hover:border-circle-frost/30"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <section className="space-y-5">
                  {!hideRecommendedSection && (
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                          {t("feed.recommended")}
                        </p>
                        <h2 className="mt-2 text-2xl md:text-3xl font-black uppercase tracking-tighter">
                          {t("feed.recommended")}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentView("spin")}
                        className="hidden md:inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-card px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/60 hover:text-circle-text transition-colors"
                      >
                        {t("feed.heroPrimary")}
                      </button>
                    </div>
                  )}

                  {!hideRecommendedSection &&
                    (featuredLoading ? (
                      <RestaurantListSkeleton count={3} />
                    ) : featuredRestaurants.length === 0 ? (
                      <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-16">
                        {t("feed.empty")}
                      </p>
                    ) : (
                      <RestaurantList
                        restaurants={recommendedRestaurants}
                        onRate={handleRateRequest}
                        onViewAll={handleCountrySelect}
                        onProfileClick={handleProfileView}
                        isFiltered
                      />
                    ))}
                </section>

                <div className="border-t border-circle-border" />
              </div>

              <section id="explore" className="space-y-10">
                {state.viewAllCountry && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setViewAllCountry(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-circle-amber/10 border border-circle-amber/30 text-circle-amber font-black text-[10px] uppercase tracking-[0.3em] hover:bg-circle-amber/20 transition-colors"
                    >
                      {t("feed.clearFilter", { cuisine: state.viewAllCountry })}
                      <X size={14} />
                    </button>
                  </div>
                )}

                {initialFeedLoading ? (
                  <RestaurantListSkeleton count={4} />
                ) : feedError ? (
                  <p className="text-center text-red-300 font-bold py-24">
                    {feedError}
                  </p>
                ) : feedRestaurants.length === 0 ? (
                  <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-24">
                    {t("feed.empty")}
                  </p>
                ) : (
                  <RestaurantList
                    restaurants={filteredRestaurants}
                    onRate={handleRateRequest}
                    onViewAll={handleCountrySelect}
                    onProfileClick={handleProfileView}
                    isFiltered={!!state.viewAllCountry}
                  />
                )}

                {feedLoadingMore && (
                  <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-8">
                    {t("feed.loadingMore")}
                  </p>
                )}

                {!initialFeedLoading &&
                  !feedError &&
                  feedRestaurants.length > 0 &&
                  canLoadMore && (
                    <InfiniteScrollSentinel
                      onVisible={handleLoadMore}
                      disabled={feedLoadingMore || feedLoading}
                    />
                  )}
              </section>
            </MDiv>
          )}

          {state.currentView === "spin" && (
            <MDiv
              key="spin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <section className="space-y-8">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.45em] font-black text-circle-frost/35">
                    {t("feed.heroPrimary")}
                  </p>
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                    {t("feed.heroPrimary")}
                  </h2>
                  <p className="max-w-2xl mx-auto text-circle-frost/65">
                    Combine plusieurs critères pour trouver le restaurant idéal.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                      {t("feed.search")}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={state.explorerSearchDraft}
                        onChange={(e) => setExplorerSearchDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setExplorerSearchQuery(
                              state.explorerSearchDraft.trim(),
                            );
                          }
                        }}
                        placeholder={t("feed.search")}
                        className="w-full rounded-2xl border border-circle-border bg-circle-bg/60 px-4 py-3 text-sm font-bold outline-none focus:border-circle-amber"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExplorerSearchQuery(
                            state.explorerSearchDraft.trim(),
                          )
                        }
                        className="rounded-2xl border border-circle-border bg-circle-card px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/70 hover:text-circle-amber transition-colors"
                      >
                        Go
                      </button>
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                      Cuisine
                    </span>
                    <select
                      value={explorerPrefs.cuisine}
                      onChange={(e) =>
                        updateExplorerPrefs({ cuisine: e.target.value })
                      }
                      className="w-full rounded-2xl border border-circle-border bg-circle-bg/60 px-4 py-3 text-sm font-bold outline-none focus:border-circle-amber"
                    >
                      <option value="">{t("feed.filter.all")}</option>
                      {cuisineOptions.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                      <span>Note min.</span>
                      <span>{explorerPrefs.minRating.toFixed(1)}</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={explorerPrefs.minRating}
                      onChange={(e) =>
                        updateExplorerPrefs({
                          minRating: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#ff9f1c]"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                      Tri
                    </span>
                    <select
                      value={explorerPrefs.sortBy}
                      onChange={(e) =>
                        updateExplorerPrefs({
                          sortBy: e.target.value as ExplorerSort,
                        })
                      }
                      className="w-full rounded-2xl border border-circle-border bg-circle-bg/60 px-4 py-3 text-sm font-bold outline-none focus:border-circle-amber"
                    >
                      <option value="recommended">
                        {t("feed.recommended")}
                      </option>
                      <option value="rating">{t("feed.filter.top")}</option>
                      <option value="newest">Nouveautés</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateExplorerPrefs({
                        hasWebsite: !explorerPrefs.hasWebsite,
                      })
                    }
                    className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                      explorerPrefs.hasWebsite
                        ? "border-circle-amber/50 bg-circle-amber text-[#081c1b]"
                        : "border-circle-border bg-circle-bg/60 text-circle-frost/60"
                    }`}
                  >
                    Site web
                  </button>
                  <button
                    type="button"
                    onClick={resetExplorerPrefs}
                    className="rounded-full border border-circle-border bg-circle-bg/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/60"
                  >
                    {t("feed.filter.reset")}
                  </button>
                </div>

                {explorerLoading ? (
                  <RestaurantListSkeleton count={4} />
                ) : explorerError ? (
                  <p className="text-center text-red-300 font-bold py-24">
                    {explorerError}
                  </p>
                ) : (
                  <RestaurantList
                    restaurants={explorerResults}
                    onRate={handleRateRequest}
                    onViewAll={handleCountrySelect}
                    onProfileClick={handleProfileView}
                    isFiltered
                  />
                )}
              </section>
            </MDiv>
          )}

          {state.currentView === "wheel" && (
            <MDiv
              key="wheel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <section className="space-y-6 px-4 sm:space-y-8 sm:px-6">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.45em] font-black text-circle-frost/35">
                    {t("nav.wheel")}
                  </p>
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                    {t("wheel.title")}
                  </h2>
                  <p className="max-w-2xl mx-auto text-circle-frost/65">
                    {t("wheel.subtitle")}
                  </p>
                </div>

                {wheelLoading ? (
                  <RestaurantListSkeleton count={1} />
                ) : wheelCountries.length === 0 ? (
                  <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-24">
                    {t("home.empty")}
                  </p>
                ) : (
                  <div className="flex justify-center pb-6 sm:pb-10">
                    <WheelOfFortune
                      segments={wheelCountries}
                      excludedSegments={excludedCountries}
                      onResult={handleWheelResult}
                    />
                  </div>
                )}
              </section>
            </MDiv>
          )}

          {state.currentView === "wheel-result" && state.wheelCountry && (
            <MDiv
              key="wheel-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <WheelCountryView
                country={state.wheelCountry}
                restaurants={wheelCountryRestaurants}
                loading={wheelCountryLoading}
                error={wheelCountryError}
                onBack={() => {
                  setWheelCountry(null);
                  setWheelCountryRestaurants([]);
                  setWheelCountryError(null);
                  setCurrentView("wheel");
                }}
                onRate={handleRateRequest}
                onProfileClick={handleProfileView}
              />
            </MDiv>
          )}

          {state.currentView === "map" && (
            <MDiv
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MapView
                restaurants={mapDisplayRestaurants}
                onRate={handleRateRequest}
                loading={mapLoading}
                filters={mapFilters}
                onFiltersChange={updateMapFilters}
              />
            </MDiv>
          )}

          {state.currentView === "ai" && (
            <MDiv
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AIResearch />
            </MDiv>
          )}

          {state.currentView === "profile" && state.targetProfile && (
            <MDiv
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {profileRestaurantsLoading &&
              user &&
              state.targetProfile.name === user.username ? (
                <RestaurantListSkeleton count={2} />
              ) : (
                <ProfileView
                  userId={user?.id ?? ""}
                  profile={{
                    name: state.targetProfile.name,
                    avatar: state.targetProfile.avatar,
                    email:
                      user && state.targetProfile.name === user.username
                        ? user.email
                        : undefined,
                    bio:
                      user && state.targetProfile.name === user.username
                        ? user.bio
                        : undefined,
                  }}
                  restaurants={
                    user && state.targetProfile.name === user.username
                      ? profileRestaurants
                      : feedRestaurants
                  }
                  isOwnProfile={Boolean(
                    user && state.targetProfile.name === user.username,
                  )}
                  excludedCountries={
                    user && state.targetProfile.name === user.username
                      ? excludedCountries
                      : []
                  }
                  onBack={() => setCurrentView("feed")}
                  onRate={handleRateRequest}
                  onProfileClick={handleProfileView}
                  onProfileUpdate={handleProfileUpdate}
                  onToggleExcludedCountry={handleToggleExcludedCountry}
                  onLogout={handleLogout}
                />
              )}
            </MDiv>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-24 border-t border-circle-border text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.6em]">
          {APP_NAME}
        </p>
        <a
          href="/docs"
          className="mt-4 inline-flex items-center justify-center rounded-full border border-circle-border bg-circle-card/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-circle-frost/70 transition-colors hover:text-circle-amber"
        >
          Swagger
        </a>
      </footer>

      <AnimatePresence>
        {state.authOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <MDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <MDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-circle-card border border-circle-border rounded-[3rem] p-10"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-circle-amber uppercase tracking-tighter">
                  {APP_NAME}
                </h2>
                <p className="text-circle-frost/40 text-xs font-black uppercase tracking-[0.3em] mt-2">
                  {t("auth.tagline")}
                </p>
              </div>
              {authFormContent}
            </MDiv>
          </div>
        )}
        {state.ratingTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <MDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingTarget(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <MDiv
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-circle-card border border-circle-border rounded-[3rem] p-12 text-center"
            >
              <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-circle-amber">
                {t("rate.title")}
              </h3>
              <p className="text-circle-frost/40 text-xs font-black mb-10 uppercase tracking-widest">
                {state.ratingTarget.name}
              </p>
              <StarRating
                restaurantId={state.ratingTarget.id}
                onRate={(val) => {
                  const rated = state.ratingTarget!;
                  handleRateSuccess(rated.id, val);
                  window.setTimeout(() => {
                    setRatingTarget(null);
                    if (
                      user &&
                      !getExcludedCountries(user.id).includes(rated.country)
                    ) {
                      setExcludePromptCountry(rated.country);
                      setExcludePromptOpen(true);
                    }
                  }, 800);
                }}
              />
              <button
                onClick={() => setRatingTarget(null)}
                title={t("rate.cancel")}
                className="mt-12 text-circle-text/20 font-black text-xs uppercase tracking-[0.4em] hover:text-circle-text"
              >
                {t("rate.cancel")}
              </button>
            </MDiv>
          </div>
        )}
      </AnimatePresence>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />

      <ExcludeCountryPrompt
        open={excludePromptOpen}
        country={excludePromptCountry}
        onExclude={handleConfirmExclude}
        onDismiss={() => {
          setExcludePromptOpen(false);
          setExcludePromptCountry(null);
        }}
      />
    </div>
  );
};

export default CircleApp;
