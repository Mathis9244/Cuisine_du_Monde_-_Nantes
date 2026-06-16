"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

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

    const savedRatings = localStorage.getItem("nwe-ratings-store");
    if (savedRatings) {
      const parsed = JSON.parse(savedRatings);
      if (parsed[restaurantId]) {
        setRating(parsed[restaurantId]);
      }
    }
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [restaurantId]);

  const handleRate = (val: number) => {
    if (!isLoggedIn) return;

    setRating(val);
    const savedRatings = localStorage.getItem("nwe-ratings-store") || "{}";
    const parsed = JSON.parse(savedRatings);
    parsed[restaurantId] = val;
    localStorage.setItem("nwe-ratings-store", JSON.stringify(parsed));

    if (onRate) onRate(val);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`transition-all duration-150 ${
              star <= (hover || rating)
                ? "text-circle-amber scale-110"
                : "text-circle-frost/10"
            } ${isLoggedIn ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
            onClick={() => handleRate(star)}
            onMouseEnter={() => isLoggedIn && setHover(star)}
            onMouseLeave={() => isLoggedIn && setHover(0)}
          >
            <Star
              size={32}
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
