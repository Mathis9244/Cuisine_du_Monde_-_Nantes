"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import {
  LocateFixed,
  Navigation,
  X,
} from "lucide-react";
import type { GeoPoint, MapFilters, Restaurant } from "@/lib/types";
import { formatDistanceKm, haversineKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  loading?: boolean;
  userLocation: GeoPoint | null;
  onRequestLocation: () => void;
  filters: MapFilters;
  onFiltersChange: (next: Partial<MapFilters>) => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type MarkerClusterGroupCtor = typeof L & {
  markerClusterGroup: (
    options?: L.MarkerClusterGroupOptions,
  ) => L.MarkerClusterGroup;
};

function safeRemoveCluster(map: L.Map, cluster: L.MarkerClusterGroup) {
  try {
    cluster.clearLayers();
    if (map.hasLayer(cluster)) {
      map.removeLayer(cluster);
    }
  } catch {
    // Carte déjà détruite.
  }
}

function ClusteredMarkers({
  restaurants,
  onRate,
  rateLabel,
  directionsLabel,
  userLocation,
}: {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  rateLabel: string;
  directionsLabel: string;
  userLocation: GeoPoint | null;
}) {
  const map = useMap();
  const onRateRef = useRef(onRate);
  const rateLabelRef = useRef(rateLabel);
  const directionsLabelRef = useRef(directionsLabel);
  const userLocationRef = useRef(userLocation);
  const hasFittedRef = useRef(false);
  const mountedRef = useRef(true);

  onRateRef.current = onRate;
  rateLabelRef.current = rateLabel;
  directionsLabelRef.current = directionsLabel;
  userLocationRef.current = userLocation;

  const withCoords = useMemo(
    () =>
      restaurants.filter(
        (r) => r.latitude != null && r.longitude != null,
      ) as (Restaurant & { latitude: number; longitude: number })[],
    [restaurants],
  );

  const markerKey = useMemo(
    () =>
      withCoords
        .map((r) => `${r.id}:${r.latitude},${r.longitude}`)
        .join("|"),
    [withCoords],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cluster: L.MarkerClusterGroup | null = null;

    const onPopupOpen = (e: L.LeafletEvent) => {
      const popup = (e as L.PopupEvent).popup;
      const btn = (popup.getElement() as HTMLElement | undefined)?.querySelector(
        "[data-rate-id]",
      ) as HTMLButtonElement | null;
      if (!btn) return;
      const id = btn.getAttribute("data-rate-id");
      const restaurant = withCoords.find((r) => r.id === id);
      if (!restaurant) return;
      btn.onclick = () => onRateRef.current(restaurant);
    };

    const attachCluster = () => {
      if (!mountedRef.current || !map.getContainer()) return;

      cluster = (L as MarkerClusterGroupCtor).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });

      for (const r of withCoords) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${r.name} ${r.address}`,
        )}`;
        const distanceText =
          userLocationRef.current && r.latitude && r.longitude
            ? `${formatDistanceKm(
                haversineKm(userLocationRef.current, {
                  latitude: r.latitude,
                  longitude: r.longitude,
                }),
              )}`
            : null;
        const marker = L.marker([r.latitude, r.longitude]);
        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:200px">
            <strong style="font-size:14px">${escapeHtml(r.name)}</strong>
            <p style="margin:6px 0 0;font-size:12px;opacity:0.75">${escapeHtml(r.address)}</p>
            <p style="margin:4px 0 0;font-size:11px;opacity:0.6">${escapeHtml(r.country)} · ${escapeHtml(r.specialty)}</p>
            ${
              distanceText
                ? `<p style="margin:4px 0 0;font-size:11px;opacity:0.6">${escapeHtml(distanceText)}</p>`
                : ""
            }
            <div style="display:flex;gap:8px;margin-top:10px">
              <button type="button" data-rate-id="${escapeHtml(r.id)}" style="flex:1;padding:8px;border:none;border-radius:8px;background:#ff9f1c;color:#081c1b;font-weight:700;font-size:11px;cursor:pointer;text-transform:uppercase">${escapeHtml(rateLabelRef.current)}</button>
              <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" style="padding:8px 12px;border-radius:8px;background:#2ec4b6;color:#fff;font-size:11px;font-weight:700;text-decoration:none">${escapeHtml(directionsLabelRef.current)}</a>
            </div>
          </div>
        `);
        cluster.addLayer(marker);
      }

      map.on("popupopen", onPopupOpen);
      map.addLayer(cluster);

      window.setTimeout(() => {
        if (!mountedRef.current) return;
        try {
          map.invalidateSize({ animate: false });
        } catch {
          // ignore
        }
      }, 350);

      if (withCoords.length > 0 && !hasFittedRef.current) {
        const bounds = L.latLngBounds(
          withCoords.map(
            (r) => [r.latitude, r.longitude] as [number, number],
          ),
        );
        try {
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15,
            animate: false,
          });
          hasFittedRef.current = true;
        } catch {
          // ignore
        }
      }
    };

    if (map.whenReady) {
      map.whenReady(attachCluster);
    } else {
      attachCluster();
    }

    return () => {
      mountedRef.current = false;
      map.off("popupopen", onPopupOpen);
      if (cluster) {
        safeRemoveCluster(map, cluster);
        cluster = null;
      }
    };
  }, [map, markerKey, withCoords]);

  return null;
}

const MapView: React.FC<MapViewProps> = ({
  restaurants,
  onRate,
  loading,
  userLocation,
  onRequestLocation,
  filters,
  onFiltersChange,
}) => {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const withCoords = restaurants.filter(
    (r) => r.latitude != null && r.longitude != null,
  );
  const center: [number, number] = [47.2184, -1.5536];
  const mapSkin = resolved === "dark" ? "dark" : "voyager";
  const tileUrl =
    resolved === "dark"
      ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const filtered = useMemo(() => {
    const base = withCoords.filter((restaurant) => {
      if (filters.cuisine && restaurant.country !== filters.cuisine) return false;
      if ((restaurant.rating ?? 0) < filters.minRating) return false;
      if ((filters.nearbyOnly || filters.maxDistanceKm > 0) && !userLocation) return false;
      if (userLocation && (filters.nearbyOnly || filters.maxDistanceKm > 0)) {
        const maxKm = filters.maxDistanceKm || 10;
        const dist = haversineKm(userLocation, {
          latitude: restaurant.latitude!,
          longitude: restaurant.longitude!,
        });
        if (dist > maxKm) return false;
      }
      return true;
    });

    const sorters: Record<typeof filters.sortBy, (a: Restaurant, b: Restaurant) => number> = {
      recommended: (a, b) => {
        const score = (restaurant: Restaurant) => {
          let value = restaurant.rating ?? 0;
          if (restaurant.website) value += 0.25;
          value += (restaurant.friendRatings?.length ?? 0) * 0.15;
          if (userLocation && restaurant.latitude != null && restaurant.longitude != null) {
            const distance = haversineKm(userLocation, {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            });
            value += Math.max(0, 2.5 - distance * 0.25);
          }
          return value;
        };
        return score(b) - score(a);
      },
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      distance: (a, b) => {
        if (!userLocation) return (b.rating ?? 0) - (a.rating ?? 0);
        const da = haversineKm(userLocation, {
          latitude: a.latitude!,
          longitude: a.longitude!,
        });
        const db = haversineKm(userLocation, {
          latitude: b.latitude!,
          longitude: b.longitude!,
        });
        return da - db;
      },
      popular: (a, b) =>
        (b.friendRatings?.length ?? 0) - (a.friendRatings?.length ?? 0) ||
        (b.rating ?? 0) - (a.rating ?? 0),
    };

    return base.sort(sorters[filters.sortBy]);
  }, [filters, userLocation, withCoords]);

  const withLocation = userLocation && filtered.length > 0;

  if (loading) {
    return (
      <p className="text-center text-circle-frost/30 font-black uppercase tracking-[0.4em] py-24">
        {t("map.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-circle-border bg-circle-card/60 p-4 md:p-5 shadow-2xl shadow-black/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              {t("map.title")}
            </h2>
            <p className="mt-1 text-circle-frost/50 text-xs font-black uppercase tracking-[0.3em]">
              {t("map.count", { count: filtered.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestLocation}
            className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-bg/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-circle-text/75 hover:text-circle-amber hover:border-circle-amber/40 transition-colors"
          >
            <LocateFixed size={14} />
            {t("map.location")}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] font-black text-circle-frost/35">
          <span>{t("map.skin")}</span>
          <span className="rounded-full border border-circle-border bg-circle-bg/70 px-3 py-1 text-circle-frost/60">
            {mapSkin}
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="rounded-2xl border border-circle-border bg-circle-bg/60 p-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-circle-frost/35 font-black">
              {t("map.filters")}
            </span>
            <select
              value={filters.cuisine}
              onChange={(e) => onFiltersChange({ cuisine: e.target.value })}
              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
            >
              <option value="">{t("feed.filter.all")}</option>
              {Array.from(new Set(restaurants.map((r) => r.country)))
                .sort()
                .map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
          </label>

          <label className="rounded-2xl border border-circle-border bg-circle-bg/60 p-3">
            <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-circle-frost/35 font-black">
              <span>Note min.</span>
              <span>{filters.minRating.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filters.minRating}
              onChange={(e) =>
                onFiltersChange({ minRating: Number(e.target.value) })
              }
              className="mt-3 w-full accent-[#ff9f1c]"
            />
          </label>

          <label className="rounded-2xl border border-circle-border bg-circle-bg/60 p-3">
            <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-circle-frost/35 font-black">
              <span>{t("map.radius")}</span>
              <span>{filters.maxDistanceKm || 0} km</span>
            </span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={filters.maxDistanceKm}
              onChange={(e) =>
                onFiltersChange({ maxDistanceKm: Number(e.target.value) })
              }
              className="mt-3 w-full accent-[#ff9f1c]"
            />
          </label>

          <label className="rounded-2xl border border-circle-border bg-circle-bg/60 p-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-circle-frost/35 font-black">
              {t("map.popularity")}
            </span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({
                  sortBy: e.target.value as MapFilters["sortBy"],
                })
              }
              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
            >
              <option value="recommended">{t("feed.recommended")}</option>
              <option value="distance">{t("map.nearby")}</option>
              <option value="rating">{t("feed.filter.top")}</option>
              <option value="popular">{t("map.popularity")}</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!filters.nearbyOnly) onRequestLocation();
              onFiltersChange({ nearbyOnly: !filters.nearbyOnly });
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
              filters.nearbyOnly
                ? "border-circle-amber/50 bg-circle-amber text-[#081c1b]"
                : "border-circle-border bg-circle-card/70 text-circle-frost/60 hover:text-circle-text hover:border-circle-frost/30"
            }`}
          >
            <Navigation size={14} />
            {t("map.nearby")}
          </button>
          <button
            type="button"
            onClick={() =>
              onFiltersChange({
                cuisine: "",
                minRating: 0,
                nearbyOnly: false,
                maxDistanceKm: 0,
                sortBy: "recommended",
              })
            }
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] border-circle-border bg-circle-card/70 text-circle-frost/60 hover:text-circle-text hover:border-circle-frost/30 transition-all"
          >
            <X size={14} />
            {t("map.reset")}
          </button>
          {userLocation && (
            <span className="inline-flex items-center gap-2 rounded-full border border-circle-border bg-circle-bg/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-circle-frost/50">
              {t("map.location")}
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-circle-frost/40 font-black uppercase tracking-[0.4em] py-24">
          {t("feed.empty")}
        </p>
      ) : (
        <div className="h-[min(70vh,560px)] w-full rounded-[2rem] overflow-hidden border border-circle-border shadow-2xl z-0">
          <MapContainer
            key="circle-map"
            center={center}
            zoom={13}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution={tileAttribution}
              url={tileUrl}
            />
            <ClusteredMarkers
              restaurants={filtered}
              onRate={onRate}
              rateLabel={t("rate.button")}
              directionsLabel={t("map.directions")}
              userLocation={withLocation ? userLocation : null}
            />
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default MapView;
