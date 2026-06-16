"use client";

import React from "react";
import WheelOfFortune from "@/components/WheelOfFortune";
import { APP_NAME } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

function WheelSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 animate-pulse" aria-hidden>
      <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-circle-card border border-circle-border" />
      <div className="h-14 w-48 rounded-2xl bg-circle-card border border-circle-border" />
    </div>
  );
}

interface HomeHeroProps {
  cuisines: string[];
  loading: boolean;
  error: string | null;
  onWheelResult: (country: string) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({
  cuisines,
  loading,
  error,
  onWheelResult,
}) => {
  const { t } = useI18n();

  return (
    <section id="home" className="space-y-12 pb-8">
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
          {APP_NAME}
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
        <div className="text-center space-y-4 py-8">
          <p className="text-red-400 font-bold">{error}</p>
          <p className="text-circle-frost/50 text-sm">{t("home.errorHint")}</p>
        </div>
      ) : cuisines.length === 0 ? (
        <p className="text-center text-circle-frost/40 font-black uppercase tracking-[0.4em] py-16">
          {t("home.empty")}
        </p>
      ) : (
        <WheelOfFortune segments={cuisines} onResult={onWheelResult} />
      )}

      <div className="text-center">
        <a
          href="#explore"
          className="inline-flex items-center gap-2 text-circle-frost/50 hover:text-circle-text transition-colors font-black text-xs uppercase tracking-[0.3em]"
        >
          {t("home.seeAll")}
        </a>
      </div>
    </section>
  );
};

export default HomeHero;
