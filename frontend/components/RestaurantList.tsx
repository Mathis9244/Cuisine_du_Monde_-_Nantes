
import React from 'react';
import { Restaurant } from '../types';
import RestaurantCard from './RestaurantCard';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRate: (restaurant: Restaurant) => void;
  onViewAll: (country: string) => void;
  onProfileClick?: (profile: { name: string, avatar: string }) => void;
  isFiltered?: boolean;
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants, onRate, onViewAll, onProfileClick, isFiltered }) => {
  const grouped = restaurants.reduce((acc, curr) => {
    if (!acc[curr.country]) acc[curr.country] = [];
    acc[curr.country].push(curr);
    return acc;
  }, {} as Record<string, Restaurant[]>);

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
      {(Object.entries(grouped) as [string, Restaurant[]][]).map(([country, items]) => (
        <section key={country} className="space-y-12">
          <div className="flex items-baseline justify-between border-b border-[#220135] pb-8">
            <h3 className="text-6xl font-black text-white tracking-tighter uppercase">{country}</h3>
            <button 
              onClick={() => onViewAll(country)}
              className="text-xs font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-colors"
            >
              All {items.length}
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
  );
};

export default RestaurantList;

