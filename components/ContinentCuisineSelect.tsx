"use client";

import React, { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import {
  CONTINENT_ORDER,
  filterCountriesByContinent,
  groupCountriesByContinent,
  type ContinentId,
} from "@/lib/continents";

interface ContinentCuisineSelectProps {
  countries: string[];
  continent: string;
  cuisine: string;
  onContinentChange: (continent: string) => void;
  onCuisineChange: (cuisine: string) => void;
  className?: string;
  selectClassName?: string;
}

const ContinentCuisineSelect: React.FC<ContinentCuisineSelectProps> = ({
  countries,
  continent,
  cuisine,
  onContinentChange,
  onCuisineChange,
  className = "grid gap-3 sm:grid-cols-2",
  selectClassName = "w-full rounded-2xl border border-circle-border bg-circle-bg/60 px-4 py-3 text-sm font-bold outline-none focus:border-circle-amber",
}) => {
  const { t } = useI18n();

  const grouped = useMemo(
    () => groupCountriesByContinent(countries),
    [countries],
  );

  const filteredCountries = useMemo(
    () => filterCountriesByContinent(countries, continent),
    [countries, continent],
  );

  const handleContinentChange = (next: string) => {
    onContinentChange(next);
    if (cuisine && next && !filterCountriesByContinent([cuisine], next).length) {
      onCuisineChange("");
    }
  };

  return (
    <div className={className}>
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
          {t("continent.label")}
        </span>
        <select
          value={continent}
          onChange={(e) => handleContinentChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">{t("continent.all")}</option>
          {CONTINENT_ORDER.map((id) => {
            const hasCountries = grouped.some((g) => g.continent === id);
            if (!hasCountries) return null;
            return (
              <option key={id} value={id}>
                {t(`continent.${id}` as `continent.${ContinentId}`)}
              </option>
            );
          })}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
          {t("feed.filter.cuisine")}
        </span>
        <select
          value={cuisine}
          onChange={(e) => onCuisineChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">{t("feed.filter.all")}</option>
          {continent
            ? filteredCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))
            : grouped.map(({ continent: contId, countries: list }) => (
                <optgroup
                  key={contId}
                  label={t(`continent.${contId}` as `continent.${ContinentId}`)}
                >
                  {list.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </optgroup>
              ))}
        </select>
      </label>
    </div>
  );
};

export default ContinentCuisineSelect;
