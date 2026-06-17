"use client";

import React from "react";
import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

interface HomeHeroProps {
  totalRestaurants: number;
  recommendedCount: number;
  cuisineCount: number;
  onOpenExplorer: () => void;
  onOpenMap: () => void;
  onJumpToSearch: () => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({
  totalRestaurants,
  recommendedCount,
  cuisineCount,
  onOpenExplorer,
  onOpenMap,
  onJumpToSearch,
}) => {
  const { t } = useI18n();

  return (
    <section className="space-y-8 pb-4 md:pb-8">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <header className="rounded-[2rem] border border-circle-border bg-circle-card/70 p-6 md:p-8 shadow-2xl shadow-black/10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.45em] font-black text-circle-frost/35">
            <Sparkles size={14} />
            <span>{t("home.subtitle")}</span>
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.95] max-w-xl">
            {APP_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-circle-frost/70 leading-relaxed">
            {t("feed.heroLead")}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenExplorer}
              className="inline-flex items-center gap-2 rounded-full bg-circle-amber px-5 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-[#081c1b] hover:bg-circle-honey transition-colors"
            >
              <Search size={14} />
              {t("feed.heroPrimary")}
            </button>
            <button
              type="button"
              onClick={onOpenMap}
              className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-bg/60 px-5 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-circle-text/80 hover:border-circle-amber/40 hover:text-circle-amber transition-colors"
            >
              <MapPin size={14} />
              {t("feed.heroSecondary")}
            </button>
            <button
              type="button"
              onClick={onJumpToSearch}
              className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-card px-5 py-3 text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-circle-frost/70 hover:text-circle-text transition-colors"
            >
              <ArrowRight size={14} />
              {t("feed.heroTertiary")}
            </button>
          </div>
        </header>

        <aside className="grid gap-3">
          <div className="rounded-[2rem] border border-circle-border bg-circle-card/50 p-5 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
              {t("feed.recommended")}
            </p>
            <p className="mt-3 text-3xl font-black text-circle-amber">
              {recommendedCount}
            </p>
            <p className="mt-2 text-sm text-circle-frost/60">
              {t("feed.recommendedLead")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[2rem] border border-circle-border bg-circle-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                Restaurants
              </p>
              <p className="mt-3 text-3xl font-black">{totalRestaurants}</p>
            </div>
            <div className="rounded-[2rem] border border-circle-border bg-circle-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
                Cuisines
              </p>
              <p className="mt-3 text-3xl font-black">{cuisineCount}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default HomeHero;
