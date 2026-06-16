"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Restaurant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

// Icône Leaflet par défaut (chemins cassés sous bundlers).
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
    // Carte déjà détruite (ex. changement d'onglet pendant une animation).
  }
}

function ClusteredMarkers({
  restaurants,
  onRate,
  rateLabel,
  directionsLabel,
}: {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  rateLabel: string;
  directionsLabel: string;
}) {
  const map = useMap();
  const onRateRef = useRef(onRate);
  const rateLabelRef = useRef(rateLabel);
  const directionsLabelRef = useRef(directionsLabel);
  const hasFittedRef = useRef(false);
  const mountedRef = useRef(true);

  onRateRef.current = onRate;
  rateLabelRef.current = rateLabel;
  directionsLabelRef.current = directionsLabel;

  const withCoords = useMemo(
    () =>
      restaurants.filter(
        (r) => r.latitude != null && r.longitude != null,
      ) as (Restaurant & { latitude: number; longitude: number })[],
    [restaurants],
  );

  const markerKey = useMemo(
    () => withCoords.map((r) => `${r.id}:${r.latitude},${r.longitude}`).join("|"),
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
        const marker = L.marker([r.latitude, r.longitude]);
        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:180px">
            <strong style="font-size:14px">${escapeHtml(r.name)}</strong>
            <p style="margin:6px 0 0;font-size:12px;opacity:0.75">${escapeHtml(r.address)}</p>
            <p style="margin:4px 0 0;font-size:11px;opacity:0.6">${escapeHtml(r.country)} · ${escapeHtml(r.specialty)}</p>
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

      // Recalcule la taille après l'animation d'entrée Framer Motion.
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

const MapView: React.FC<MapViewProps> = ({ restaurants, onRate, loading }) => {
  const { t } = useI18n();
  const withCoords = restaurants.filter(
    (r) => r.latitude != null && r.longitude != null,
  );
  const center: [number, number] = [47.2184, -1.5536];

  if (loading) {
    return (
      <p className="text-center text-circle-frost/30 font-black uppercase tracking-[0.4em] py-24">
        {t("map.loading")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter">
          {t("map.title")}
        </h2>
        <p className="text-circle-frost/50 text-xs font-black uppercase tracking-[0.3em]">
          {t("map.count", { count: withCoords.length })}
        </p>
      </div>

      {withCoords.length === 0 ? (
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClusteredMarkers
              restaurants={restaurants}
              onRate={onRate}
              rateLabel={t("rate.button")}
              directionsLabel={t("map.directions")}
            />
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default MapView;
