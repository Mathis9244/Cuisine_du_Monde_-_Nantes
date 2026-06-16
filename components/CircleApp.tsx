"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, ArrowLeft, Shield, X, LogIn } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Restaurant, FriendRating } from "@/lib/types";
import { fetchCuisines, fetchRestaurants } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import { countryToCuisine, cuisineToCountry } from "@/lib/mappers";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import WheelOfFortune from "./WheelOfFortune";
import HomeHero from "./HomeHero";
import RestaurantList from "./RestaurantList";
import StarRating from "./StarRating";
import GooeyNav from "./GooeyNav";
import ProfileView from "./ProfileView";
import AIResearch from "./AIResearch";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import InfiniteScrollSentinel from "./InfiniteScrollSentinel";
import { RestaurantListSkeleton } from "./RestaurantCardSkeleton";
import { useI18n } from "@/lib/i18n";

function MapLoadingFallback() {
  const { t } = useI18n();
  return (
    <p className="text-center text-circle-frost/30 font-black uppercase tracking-[0.4em] py-24">
      {t("map.loading")}
    </p>
  );
}

// Leaflet utilise `window` : import dynamique sans SSR.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

const MDiv = motion.div as any;

type ViewMode = "feed" | "spin" | "map" | "profile" | "ai";

interface SessionUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

const avatarFor = (username: string) =>
  `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

const CircleApp: React.FC = () => {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<ViewMode>("feed");
  const [ratingTarget, setRatingTarget] = useState<Restaurant | null>(null);
  // Initialise le filtre cuisine depuis l'URL pour éviter un double fetch au montage.
  const [viewAllCountry, setViewAllCountry] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("cuisine");
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [targetProfile, setTargetProfile] = useState<{
    name: string;
    avatar: string;
  } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "join">("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wheelCountries, setWheelCountries] = useState<string[]>([]);
  const [wheelLoading, setWheelLoading] = useState(true);
  const [wheelError, setWheelError] = useState<string | null>(null);
  const [mapRestaurants, setMapRestaurants] = useState<Restaurant[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Débounce léger pour une recherche fluide (évite le lag au clavier).
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  // Evite que des réponses "anciennes" (requêtes lentes) écrasent le state récent.
  const loadRestaurantsReqId = React.useRef(0);

  const applyLocalRatings = useCallback(
    (list: Restaurant[], current: SessionUser | null): Restaurant[] => {
      // Sans user connecté, on retire les ratings ajoutés côté client.
      if (!current) {
        return list.map((r) => ({ ...r, friendRatings: undefined }));
      }
      const saved = localStorage.getItem("nwe-ratings-store");
      if (!saved) return list;
      const parsed = JSON.parse(saved) as Record<string, number>;
      return list.map((res) => {
        if (!parsed[res.id]) return res;
        const others = (res.friendRatings || []).filter(
          (fr) => fr.name !== current.username,
        );
        const newRating: FriendRating = {
          name: current.username,
          avatar: avatarFor(current.username),
          rating: parsed[res.id],
        };
        return { ...res, friendRatings: [...others, newRating] };
      });
    },
    [],
  );

  const loadRestaurants = useCallback(
    async (current: SessionUser | null, opts?: { append?: boolean; page?: number }) => {
      const reqId = ++loadRestaurantsReqId.current;
      const effectivePage = opts?.page ?? 1;
      const isAppend = Boolean(opts?.append);
      if (isAppend) setLoadingMore(true);
      else setRestaurantsLoading(true);
      setRestaurantsError(null);
      try {
        const cuisineFilter = viewAllCountry
          ? countryToCuisine(viewAllCountry)
          : undefined;
        const res = await fetchRestaurants({
          page: effectivePage,
          limit: 20,
          search: debouncedSearch || undefined,
          cuisine: cuisineFilter,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (reqId !== loadRestaurantsReqId.current) return;
        setTotalPages(res.meta.totalPages);
        const next = applyLocalRatings(res.data, current);
        setRestaurants((prev) => (isAppend ? [...prev, ...next] : next));
      } catch (err) {
        if (reqId === loadRestaurantsReqId.current) {
          setRestaurantsError(
            err instanceof Error ? err.message : "Erreur de chargement",
          );
        }
      } finally {
        if (reqId === loadRestaurantsReqId.current) {
          if (isAppend) setLoadingMore(false);
          else setRestaurantsLoading(false);
        }
      }
    },
    [applyLocalRatings, debouncedSearch, viewAllCountry],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();

    const toSessionUser = async (
      sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined,
    ): Promise<SessionUser | null> => {
      if (!sessionUser) return null;
      const username =
        (sessionUser.user_metadata?.username as string | undefined) ||
        sessionUser.email?.split("@")[0] ||
        "user";
      let isAdmin = false;
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const me = (await res.json()) as { isAdmin?: boolean };
          isAdmin = Boolean(me.isAdmin);
        }
      } catch {
        // ignore
      }
      return {
        id: sessionUser.id,
        email: sessionUser.email || "",
        username,
        isAdmin,
      };
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = await toSessionUser(data.session?.user);
      setUser(sessionUser);
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = await toSessionUser(session?.user);
        setUser(sessionUser);
      },
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Recharge la liste quand les filtres changent.
  // IMPORTANT : on ne refetch pas quand `user` arrive, pour éviter un double fetch.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    setPage(1);
    void loadRestaurants(user, { page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, viewAllCountry, loadRestaurants]);

  // Quand l'utilisateur change (login/logout), on applique juste les ratings côté client.
  useEffect(() => {
    if (restaurants.length === 0) return;
    setRestaurants((prev) => applyLocalRatings(prev, user));
  }, [user, applyLocalRatings]); 

  // Cuisines complètes pour la roue (section accueil + onglet Spin).
  useEffect(() => {
    let active = true;
    setWheelLoading(true);
    setWheelError(null);
    fetchCuisines()
      .then((slugs) => {
        if (!active) return;
        setWheelCountries(
          Array.from(new Set(slugs.map((s) => cuisineToCountry(s)))).sort(),
        );
      })
      .catch((err) => {
        if (active) {
          setWheelError(
            err instanceof Error ? err.message : "Erreur de chargement",
          );
          setWheelCountries([]);
        }
      })
      .finally(() => {
        if (active) setWheelLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Données carte : charge tous les restos géolocalisés à l'ouverture de l'onglet.
  useEffect(() => {
    if (currentView !== "map") return;
    let active = true;
    setMapLoading(true);
    // Limite réduite pour accélérer le chargement de la carte.
    fetchRestaurants({ limit: 200, sortBy: "name", sortOrder: "asc" })
      .then((res) => {
        if (active) setMapRestaurants(applyLocalRatings(res.data, user));
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
  }, [currentView, user, applyLocalRatings]);

  const canLoadMore = page < totalPages;
  const initialFeedLoading = restaurantsLoading && restaurants.length === 0;

  const handleLoadMore = useCallback(async () => {
    if (restaurantsLoading || loadingMore || !canLoadMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadRestaurants(user, { append: true, page: nextPage });
  }, [
    restaurantsLoading,
    loadingMore,
    canLoadMore,
    page,
    loadRestaurants,
    user,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ratingTarget) setRatingTarget(null);
      if (authOpen) setAuthOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ratingTarget, authOpen]);

  const handleLogout = () => {
    const supabase = getSupabaseBrowserClient();
    setUser(null);
    void supabase.auth.signOut();
    setCurrentView("feed");
    setViewAllCountry(null);
  };

  const handleRateSuccess = (restaurantId: string, rating: number) => {
    if (!user) return;
    setRestaurants((prev) =>
      prev.map((res) => {
        if (res.id === restaurantId) {
          const otherRatings = (res.friendRatings || []).filter(
            (fr) => fr.name !== user.username,
          );
          const newRating: FriendRating = {
            name: user.username,
            avatar: avatarFor(user.username),
            rating,
          };
          return { ...res, friendRatings: [...otherRatings, newRating] };
        }
        return res;
      }),
    );
  };

  const countries = wheelCountries.length
    ? wheelCountries
    : Array.from(new Set(restaurants.map((r) => r.country))).sort();

  // La recherche + filtre cuisine sont appliqués côté API (pagination).
  const filteredRestaurants = useMemo(() => restaurants, [restaurants]);

  const requireAuth = useCallback((action: () => void) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    action();
  }, [user]);

  const handleRateRequest = useCallback(
    (restaurant: Restaurant) => {
      requireAuth(() => setRatingTarget(restaurant));
    },
    [requireAuth],
  );

  // Ordre des onglets : 0=Feed, 1=Map, 2=Spin, 3=AI, 4=You
  const handleNav = (index: number) => {
    setViewAllCountry(null);
    setTargetProfile(null);
    if (index === 0) {
      setCurrentView("feed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (index === 1) setCurrentView("map");
    else if (index === 2) setCurrentView("spin");
    else if (index === 3) setCurrentView("ai");
    else if (index === 4) {
      requireAuth(() => {
        setTargetProfile({
          name: user!.username,
          avatar: avatarFor(user!.username),
        });
        setCurrentView("profile");
      });
    }
  };

  const handleProfileView = (profile: { name: string; avatar: string }) => {
    requireAuth(() => {
      setTargetProfile(profile);
      setCurrentView("profile");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handleCountrySelect = (country: string) => {
    setViewAllCountry(country);
    setCurrentView("feed");
    window.setTimeout(() => {
      document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      if (authMode === "join") {
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

  const authFormContent = (
    <form onSubmit={handleLogin} className="space-y-6">
      {authError && (
        <div className="px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-200 text-xs font-bold tracking-widest">
          {authError}
        </div>
      )}
      {authMode === "join" && (
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
        onChange={(e) =>
          setAuthForm({ ...authForm, email: e.target.value })
        }
        className="w-full px-6 py-5 bg-circle-card border border-circle-border rounded-3xl outline-none focus:border-circle-teal text-lg font-bold text-circle-text placeholder-circle-text/20 uppercase tracking-widest"
      />
      <input
        required
        type="password"
        placeholder={t("auth.password")}
        value={authForm.password}
        onChange={(e) =>
          setAuthForm({ ...authForm, password: e.target.value })
        }
        className="w-full px-6 py-5 bg-circle-card border border-circle-border rounded-3xl outline-none focus:border-circle-teal text-lg font-bold text-circle-text placeholder-circle-text/20 uppercase tracking-widest"
      />
      <button
        type="submit"
        disabled={authLoading}
        className="w-full bg-circle-amber text-[#081c1b] py-5 rounded-3xl font-black text-sm uppercase tracking-[0.3em] active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {authLoading
          ? "..."
          : authMode === "login"
            ? t("auth.enter")
            : t("auth.join")}
      </button>
      <div className="text-center">
        <button
          type="button"
          onClick={() =>
            setAuthMode(authMode === "join" ? "login" : "join")
          }
          className="text-[10px] font-black uppercase tracking-[0.4em] text-circle-frost/30 hover:text-circle-text transition-all"
        >
          {authMode === "join" ? t("auth.toLogin") : t("auth.toJoin")}
        </button>
      </div>
    </form>
  );

  const isAtHome = currentView === "feed" && !viewAllCountry;

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
      <nav className="sticky top-0 z-50 bg-circle-bg/80 backdrop-blur-2xl border-b border-circle-border px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center min-w-[120px]">
          {isAtHome ? (
            <div className="cursor-pointer" onClick={() => handleNav(0)}>
              <span className="font-black text-base md:text-lg uppercase tracking-widest text-circle-amber">
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

        <div className="flex items-center gap-2 md:gap-6">
          <GooeyNav
            items={[
              { label: t("nav.feed"), href: "#" },
              { label: t("nav.map"), href: "#" },
              { label: t("nav.spin"), href: "#" },
              { label: t("nav.ai"), href: "#" },
              { label: t("nav.you"), href: "#" },
            ]}
            onNav={handleNav}
            initialActiveIndex={
              currentView === "feed"
                ? 0
                : currentView === "map"
                  ? 1
                  : currentView === "spin"
                    ? 2
                    : currentView === "ai"
                      ? 3
                      : 4
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
      </nav>

      <main className="container mx-auto max-w-5xl pt-16 pb-32 px-4 md:px-8">
        <AnimatePresence mode="wait">
          {currentView === "feed" && (
            <MDiv
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-32"
            >
              {!viewAllCountry && (
                <>
                  <HomeHero
                    cuisines={countries}
                    loading={wheelLoading}
                    error={wheelError}
                    onWheelResult={handleCountrySelect}
                  />
                  <div className="border-t border-circle-border" />
                </>
              )}

              <div className="max-w-3xl mx-auto pt-4">
                <div className="relative group">
                  <Search
                    className="absolute left-8 top-1/2 -translate-y-1/2 text-circle-teal/40"
                    size={24}
                  />
                  <input
                    type="text"
                    placeholder={t("feed.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-20 pr-10 py-8 bg-circle-card border border-circle-border rounded-[2.5rem] focus:border-circle-teal transition-all text-2xl font-black text-circle-text placeholder-circle-frost/10 uppercase tracking-widest outline-none"
                  />
                </div>
              </div>

              <section id="explore" className="space-y-10">
                {viewAllCountry && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setViewAllCountry(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-circle-amber/10 border border-circle-amber/30 text-circle-amber font-black text-[10px] uppercase tracking-[0.3em] hover:bg-circle-amber/20 transition-colors"
                    >
                      {t("feed.clearFilter", { cuisine: viewAllCountry })}
                      <X size={14} />
                    </button>
                  </div>
                )}

                {initialFeedLoading ? (
                  <RestaurantListSkeleton count={4} />
                ) : restaurantsError ? (
                  <p className="text-center text-red-300 font-bold py-24">
                    {restaurantsError}
                  </p>
                ) : restaurants.length === 0 ? (
                  <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-24">
                    {t("feed.empty")}
                  </p>
                ) : (
                  <RestaurantList
                    restaurants={filteredRestaurants}
                    onRate={handleRateRequest}
                    onViewAll={handleCountrySelect}
                    onProfileClick={handleProfileView}
                    isFiltered={!!viewAllCountry}
                  />
                )}

                {loadingMore && (
                  <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-8">
                    {t("feed.loadingMore")}
                  </p>
                )}

                {!initialFeedLoading &&
                  !restaurantsError &&
                  restaurants.length > 0 &&
                  canLoadMore && (
                    <InfiniteScrollSentinel
                      onVisible={handleLoadMore}
                      disabled={loadingMore || restaurantsLoading}
                    />
                  )}
              </section>
            </MDiv>
          )}

          {currentView === "spin" && (
            <MDiv
              key="spin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <WheelOfFortune
                segments={countries}
                onResult={handleCountrySelect}
              />
            </MDiv>
          )}

          {currentView === "map" && (
            <MDiv
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MapView
                restaurants={mapRestaurants}
                onRate={handleRateRequest}
                loading={mapLoading}
              />
            </MDiv>
          )}

          {currentView === "ai" && (
            <MDiv
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AIResearch />
            </MDiv>
          )}

          {currentView === "profile" && targetProfile && (
            <MDiv
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProfileView
                profile={targetProfile}
                restaurants={restaurants}
                onBack={() => setCurrentView("feed")}
                onRate={handleRateRequest}
                onProfileClick={handleProfileView}
              />
            </MDiv>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-24 border-t border-circle-border text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.6em]">
          {APP_NAME}
        </p>
      </footer>

      <AnimatePresence>
        {authOpen && (
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
        {ratingTarget && (
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
                {ratingTarget.name}
              </p>
              <StarRating
                restaurantId={ratingTarget.id}
                onRate={(val) => {
                  handleRateSuccess(ratingTarget.id, val);
                  setTimeout(() => setRatingTarget(null), 800);
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
    </div>
  );
};

export default CircleApp;
