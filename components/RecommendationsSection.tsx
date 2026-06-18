"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import type { RecommendationReasonKey } from "@/lib/recommendations";
import RestaurantCard from "./RestaurantCard";
import { useI18n } from "@/lib/i18n";

export interface RecommendationItem {
  restaurant: Restaurant;
  reason: RecommendationReasonKey;
  reasonCountry?: string;
  reasonContinent?: string;
}

interface RecommendationsSectionProps {
  items: RecommendationItem[];
  onRate: (restaurant: Restaurant) => void;
  onViewAll?: (country: string) => void;
  onProfileClick?: (profile: { name: string; avatar: string }) => void;
  compact?: boolean;
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  items,
  onRate,
  onViewAll,
  onProfileClick,
  compact = false,
}) => {
  const { t } = useI18n();

  if (items.length === 0) return null;

  const reasonLabel = (item: RecommendationItem) => {
    if (item.reason === "liked_country" && item.reasonCountry) {
      return t("reco.reason.likedCountry", { country: item.reasonCountry });
    }
    if (item.reason === "liked_continent") {
      return t("reco.reason.likedContinent");
    }
    const keyByReason: Record<RecommendationReasonKey, string> = {
      liked_country: "reco.reason.likedCountry",
      liked_continent: "reco.reason.likedContinent",
      top_rated: "reco.reason.top_rated",
      new_for_you: "reco.reason.new_for_you",
      popular: "reco.reason.popular",
      spotlight: "reco.reason.spotlight",
    };
    return t(keyByReason[item.reason]);
  };

  return (
    <section className={compact ? "space-y-4" : "space-y-6"}>
      {!compact && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-black text-circle-amber/70">
              <Sparkles size={14} />
              {t("reco.badge")}
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-black uppercase tracking-tighter">
              {t("feed.recommended")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-circle-frost/60">
              {t("feed.recommendedLead")}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {items.map((item) => (
          <article
            key={item.restaurant.id}
            className="min-w-[min(88vw,22rem)] shrink-0 snap-start md:min-w-0"
          >
            <div className="mb-3 inline-flex max-w-full items-center rounded-full border border-circle-amber/35 bg-circle-amber/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-circle-amber">
              <Sparkles size={12} className="mr-1.5 shrink-0" />
              <span className="truncate">{reasonLabel(item)}</span>
            </div>
            <RestaurantCard
              restaurant={item.restaurant}
              onRate={() => onRate(item.restaurant)}
              onProfileClick={onProfileClick}
            />
          </article>
        ))}
      </div>
    </section>
  );
};

export default RecommendationsSection;
