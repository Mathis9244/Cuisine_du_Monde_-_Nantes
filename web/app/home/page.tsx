"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { fetchCuisines } from "@/lib/api";
import { cuisineToCountry } from "@/lib/mappers";
import WheelOfFortune from "@/components/WheelOfFortune";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

function WheelSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 animate-pulse" aria-hidden>
      <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-circle-card border border-circle-border" />
      <div className="h-14 w-48 rounded-2xl bg-circle-card border border-circle-border" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const slugs = await fetchCuisines();
        if (!active) return;
        setCuisines(
          Array.from(new Set(slugs.map((s) => cuisineToCountry(s)))).sort(),
        );
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const goToFeed = (country: string) => {
    router.push(`/?cuisine=${encodeURIComponent(country)}`);
  };

  return (
    <div className="min-h-screen bg-circle-bg text-circle-text font-sans">
      <nav className="sticky top-0 z-50 bg-circle-bg/80 backdrop-blur-2xl border-b border-circle-border px-4 md:px-8 h-20 flex items-center justify-between">
        <span className="font-black text-base md:text-lg uppercase tracking-widest text-circle-amber">
          Circle
        </span>
        <div className="flex items-center gap-2 md:gap-4">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-circle-amber text-[#081c1b] rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-circle-honey transition-all"
          >
            {t("auth.enter")} <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-3xl px-4 md:px-8 py-12 md:py-20 space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Cuisine du Monde
          </h1>
          <p className="text-circle-frost/50 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
            {t("home.subtitle")}
          </p>
          <p className="text-circle-frost/70 max-w-xl mx-auto pt-2 text-sm md:text-base">
            {t("home.lead")}
          </p>
        </header>

        {loading ? (
          <WheelSkeleton />
        ) : error ? (
          <div className="text-center space-y-4 py-16">
            <p className="text-red-400 font-bold">{error}</p>
            <p className="text-circle-frost/50 text-sm">{t("home.errorHint")}</p>
          </div>
        ) : cuisines.length === 0 ? (
          <p className="text-center text-circle-frost/40 font-black uppercase tracking-[0.4em] py-24">
            {t("home.empty")}
          </p>
        ) : (
          <WheelOfFortune segments={cuisines} onResult={goToFeed} />
        )}

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-circle-frost/50 hover:text-circle-text transition-colors font-black text-xs uppercase tracking-[0.3em]"
          >
            {t("home.seeAll")} <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    </div>
  );
}
