"use client";

import React from "react";
import { Megaphone } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import RestaurantCard from "./RestaurantCard";
import { useI18n } from "@/lib/i18n";

interface SpotlightSectionProps {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  onViewAll?: (country: string) => void;
  onProfileClick?: (profile: { name: string; avatar: string }) => void;
}

const SpotlightSection: React.FC<SpotlightSectionProps> = ({
  restaurants,
  onRate,
  onViewAll,
  onProfileClick,
}) => {
  const { t } = useI18n();
  const visible = restaurants.filter((r) => r.isSpotlight);

  if (visible.length === 0) return null;

  return (
    <section className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-black text-circle-teal/80">
          <Megaphone size={14} />
          {t("spotlight.badge")}
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl font-black uppercase tracking-tighter">
          {t("spotlight.title")}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-circle-frost/60">
          {t("spotlight.lead")}
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {visible.map((restaurant) => (
          <article
            key={restaurant.id}
            className="min-w-[min(88vw,22rem)] shrink-0 snap-start md:min-w-0"
          >
            <div className="mb-3 inline-flex max-w-full items-center rounded-full border border-circle-teal/40 bg-circle-teal/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-circle-teal">
              <Megaphone size={12} className="mr-1.5 shrink-0" />
              <span className="truncate">{t("spotlight.sponsored")}</span>
            </div>
            <RestaurantCard
              restaurant={restaurant}
              onRate={() => onRate(restaurant)}
              onProfileClick={onProfileClick}
            />
          </article>
        ))}
      </div>
    </section>
  );
};

export default SpotlightSection;
