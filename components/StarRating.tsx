"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { rateRestaurant } from "@/lib/api";

interface StarRatingProps {
  restaurantId: string;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ restaurantId, onRate }) => {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session?.access_token));
    };
    void sync();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.access_token));
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [restaurantId]);

  const handleRate = async (val: number) => {
    if (!isLoggedIn) return;
    try {
      const updated = await rateRestaurant(restaurantId, val);
      setRating(val);
      if (onRate) onRate(updated.rating ?? val);
    } catch {
      // On garde l'UI stable si la persistance échoue.
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isLoggedIn}
            aria-label={`Attribuer la note de ${star} sur 5`}
            aria-pressed={rating === star}
            className={`transition-all duration-150 ${
              star <= (hover || rating)
                ? "text-circle-amber scale-110"
                : "text-circle-frost/10"
            } ${isLoggedIn ? "cursor-pointer hover:scale-125" : "cursor-not-allowed opacity-60"}`}
            onClick={() => handleRate(star)}
            onMouseEnter={() => isLoggedIn && setHover(star)}
            onMouseLeave={() => isLoggedIn && setHover(0)}
          >
            <Star
              size={32}
              aria-hidden="true"
              fill={star <= (hover || rating) ? "#ff9f1c" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <div className="mt-2">
        <span className="text-[10px] font-black text-circle-text uppercase tracking-[0.3em]">
          {rating > 0 ? t("rate.value", { n: rating }) : t("rate.tap")}
        </span>
      </div>
    </div>
  );
};

export default StarRating;
