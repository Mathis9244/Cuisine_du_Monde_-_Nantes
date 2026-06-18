"use client";

import React from "react";
import type { Restaurant } from "@/lib/types";
import RestaurantCard from "./RestaurantCard";
import { useI18n } from "@/lib/i18n";
import { groupRestaurantsByContinent } from "@/lib/continents";
import type { ContinentId } from "@/lib/continents";

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
      {groupRestaurantsByContinent(grouped).map(
        ({ continent, countries: continentCountries }) => (
          <div key={continent} className="space-y-20">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-circle-amber/80 border-b border-circle-amber/20 pb-4">
              {t(`continent.${continent}` as `continent.${ContinentId}`)}
            </h2>
            {continentCountries.map(({ country, items }) => (
              <section key={country} className="space-y-12">
                <div className="flex items-baseline justify-between border-b border-circle-border pb-8">
                  <h3 className="text-4xl md:text-6xl font-black text-circle-text tracking-tighter uppercase">
                    {country}
                  </h3>
                  <button
                    onClick={() => onViewAll(country)}
                    className="text-xs font-black uppercase tracking-[0.5em] text-circle-text/30 hover:text-circle-text transition-colors"
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
            ))}
          </div>
        ),
      )}
    </div>
  );
};

export default React.memo(RestaurantList);
