
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';
import { Restaurant } from '../types';

const MDiv = motion.div as any;

interface RestaurantCardProps {
  restaurant: Restaurant;
  onRate?: () => void;
  onProfileClick?: (profile: { name: string, avatar: string }) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onRate, onProfileClick }) => {
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const seed = parseInt(restaurant.id) * 7;
    const base = 4.0 + (seed % 10) / 10;
    setAvgRating(parseFloat(base.toFixed(1)));
  }, [restaurant.id]);

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.address}`)}`;

  return (
    <MDiv
      whileHover={{ borderColor: '#2ec4b6' }}
      className="bg-[#0d2624] rounded-[2rem] p-8 border border-[#1a3b38] transition-all flex flex-col group shadow-2xl"
    >
      <div className="flex justify-between items-start mb-6">
        <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
          {restaurant.name}
        </h4>
        <div className="flex items-center gap-1.5 bg-[#081c1b] border border-[#1a3b38] px-3 py-1.5 rounded-full">
          <Star size={14} fill="#ff9f1c" className="text-[#ff9f1c]" />
          <span className="text-sm font-black text-white">{avgRating}</span>
        </div>
      </div>

      <p className="text-xl text-[#cbf3f0]/90 leading-snug mb-8 font-medium">
        {restaurant.description}
      </p>

      {restaurant.friendRatings && restaurant.friendRatings.length > 0 && (
        <div className="flex -space-x-2 mb-8 items-center">
          {restaurant.friendRatings.slice(0, 3).map((friend, idx) => (
            <button 
              key={idx}
              onClick={() => onProfileClick?.({ name: friend.name, avatar: friend.avatar })}
              className="w-10 h-10 rounded-full border-2 border-[#0d2624] bg-slate-800 transition-transform hover:scale-110 relative z-[1]"
            >
              <img 
                src={friend.avatar} 
                alt={friend.name} 
                className="w-full h-full rounded-full"
              />
            </button>
          ))}
          {restaurant.friendRatings.length > 3 && (
            <div className="w-10 h-10 rounded-full bg-[#081c1b] border-2 border-[#0d2624] flex items-center justify-center text-[10px] font-bold">
              +{restaurant.friendRatings.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-auto">
        <button 
          onClick={onRate}
          className="flex-1 bg-[#ff9f1c] text-[#081c1b] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ffbf69] transition-all active:scale-95"
        >
          Rate
        </button>
        <a 
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center aspect-square bg-[#2ec4b6] text-white p-4 rounded-2xl hover:bg-[#28b1a5] transition-all active:scale-95"
          title="Open in Maps"
        >
          <ExternalLink size={20} />
        </a>
      </div>
    </MDiv>
  );
};

export default RestaurantCard;

