"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

const MDiv = motion.div as any;

interface RestaurantCardProps {
  restaurant: Restaurant;
  onRate?: () => void;
  onProfileClick?: (profile: { name: string; avatar: string }) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onRate,
  onProfileClick,
}) => {
  const { t } = useI18n();
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (typeof restaurant.rating === "number") {
      setAvgRating(parseFloat(restaurant.rating.toFixed(1)));
      return;
    }
    const seed = (parseInt(restaurant.id, 10) || 1) * 7;
    const base = 4.0 + (seed % 10) / 10;
    setAvgRating(parseFloat(base.toFixed(1)));
  }, [restaurant.id, restaurant.rating]);

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name} ${restaurant.address}`,
  )}`;

  return (
    <MDiv
      whileHover={{ borderColor: "#2ec4b6" }}
      className="bg-circle-card rounded-[2rem] p-8 border border-circle-border transition-all flex flex-col group shadow-2xl"
    >
      <div className="flex justify-between items-start mb-6 gap-3">
        <div className="min-w-0 space-y-3">
          {restaurant.isSpotlight && (
            <span className="inline-flex items-center rounded-full border border-circle-teal/40 bg-circle-teal/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-circle-teal">
              {t("spotlight.sponsored")}
            </span>
          )}
          <h4 className="text-4xl font-black text-circle-text tracking-tighter uppercase leading-none">
            {restaurant.name}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 bg-circle-bg border border-circle-border px-3 py-1.5 rounded-full">
          <Star size={14} fill="#ff9f1c" className="text-circle-amber" />
          <span className="text-sm font-black text-circle-text">{avgRating}</span>
        </div>
      </div>

      <p className="text-xl text-circle-frost/90 leading-snug mb-8 font-medium">
        {restaurant.description}
      </p>

      {restaurant.friendRatings && restaurant.friendRatings.length > 0 && (
        <div className="flex -space-x-2 mb-8 items-center">
          {restaurant.friendRatings.slice(0, 3).map((friend, idx) => (
            <button
              key={idx}
              onClick={() =>
                onProfileClick?.({ name: friend.name, avatar: friend.avatar })
              }
              className="w-10 h-10 rounded-full border-2 border-circle-card bg-slate-800 transition-transform hover:scale-110 relative z-[1]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-full h-full rounded-full"
              />
            </button>
          ))}
          {restaurant.friendRatings.length > 3 && (
            <div className="w-10 h-10 rounded-full bg-circle-bg border-2 border-circle-card flex items-center justify-center text-[10px] font-bold">
              +{restaurant.friendRatings.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-auto">
        <button
          onClick={onRate}
          className="flex-1 bg-circle-amber text-[#081c1b] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-circle-honey transition-all active:scale-95"
        >
          {t("rate.button")}
        </button>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center aspect-square bg-circle-teal text-circle-text p-4 rounded-2xl hover:bg-[#28b1a5] transition-all active:scale-95"
          title={t("card.maps")}
        >
          <ExternalLink size={20} />
        </a>
      </div>
    </MDiv>
  );
};

export default React.memo(RestaurantCard);
