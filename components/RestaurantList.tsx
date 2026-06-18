"use client";

import React from "react";
import type { Restaurant } from "@/lib/types";
import RestaurantCard from "./RestaurantCard";
import { useI18n } from "@/lib/i18n";

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  onViewAll: (country: string) => void;
  onProfileClick?: (profile: { name: string; avatar: string }) => void;
  isFiltered?: boolean;
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  onRate,
  onViewAll,
  onProfileClick,
  isFiltered,
}) => {
  const { t } = useI18n();
  const grouped = restaurants.reduce(
    (acc, curr) => {
      if (!acc[curr.country]) acc[curr.country] = [];
      acc[curr.country].push(curr);
      return acc;
    },
    {} as Record<string, Restaurant[]>,
  );

  if (isFiltered) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onRate={() => onRate(restaurant)}
            onProfileClick={onProfileClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {(Object.entries(grouped) as [string, Restaurant[]][]).map(
        ([country, items]) => (
          <section key={country} className="space-y-12">
            <div className="flex items-baseline justify-between border-b border-circle-border pb-8">
              <h2 className="text-4xl font-black text-circle-text tracking-tighter uppercase sm:text-5xl md:text-6xl">
                {country}
              </h2>
              <button
                onClick={() => onViewAll(country)}
                className="text-xs font-black uppercase tracking-[0.5em] text-circle-text/70 hover:text-circle-text transition-colors"
              >
                {t("list.all", { count: items.length })}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {items.slice(0, 4).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onRate={() => onRate(restaurant)}
                  onProfileClick={onProfileClick}
                />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
};

export default React.memo(RestaurantList);
