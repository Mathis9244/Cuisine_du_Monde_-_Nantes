"use client";

import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import RestaurantList from "./RestaurantList";
import { RestaurantListSkeleton } from "./RestaurantCardSkeleton";
import { useI18n } from "@/lib/i18n";

interface WheelCountryViewProps {
  country: string;
  restaurants: Restaurant[];
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  onRate: (restaurant: Restaurant) => void;
  onProfileClick?: (profile: { name: string; avatar: string }) => void;
}

const WheelCountryView: React.FC<WheelCountryViewProps> = ({
  country,
  restaurants,
  loading,
  error,
  onBack,
  onRate,
  onProfileClick,
}) => {
  const { t } = useI18n();

  return (
    <section className="space-y-8">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <p className="text-[10px] uppercase tracking-[0.45em] font-black text-circle-frost/35">
          {t("wheel.title")}
        </p>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
          {country}
        </h2>
        <p className="max-w-2xl mx-auto text-circle-frost/65">
          {t("wheel.resultsLead", { country })}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-card/70 px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-circle-frost/70 hover:text-circle-text hover:border-circle-frost/30 transition-colors"
        >
          <ArrowLeft size={14} />
          {t("wheel.back")}
        </button>
      </div>

      <div className="max-w-4xl mx-auto rounded-[2rem] border border-circle-border bg-circle-card/60 p-5 md:p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
          <Sparkles size={14} />
          <span>{t("wheel.resultsTitle", { country })}</span>
        </div>
        <p className="mt-3 text-sm text-circle-frost/60">
          {t("wheel.resultsCount", { count: restaurants.length })}
        </p>
      </div>

      {loading ? (
        <RestaurantListSkeleton count={4} />
      ) : error ? (
        <p className="text-center text-red-300 font-bold py-24">{error}</p>
      ) : restaurants.length === 0 ? (
        <p className="text-center text-circle-text/30 font-black uppercase tracking-[0.4em] py-24">
          {t("wheel.empty")}
        </p>
      ) : (
        <RestaurantList
          restaurants={restaurants}
          onRate={onRate}
          onViewAll={() => onBack()}
          onProfileClick={onProfileClick}
          isFiltered
        />
      )}
    </section>
  );
};

export default WheelCountryView;
