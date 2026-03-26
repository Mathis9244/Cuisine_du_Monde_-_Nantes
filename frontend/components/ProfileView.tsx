
import React from 'react';
import { motion } from 'framer-motion';
import { Restaurant } from '../types';
import RestaurantCard from './RestaurantCard';
import { ArrowLeft, MapPin, Globe, Star } from 'lucide-react';

interface ProfileViewProps {
  profile: { name: string; avatar: string };
  restaurants: Restaurant[];
  onBack: () => void;
  onRate: (restaurant: Restaurant) => void;
  onProfileClick: (profile: { name: string; avatar: string }) => void;
}

const MDiv = motion.div as any;

const ProfileView: React.FC<ProfileViewProps> = ({ profile, restaurants, onBack, onRate, onProfileClick }) => {
  const userRatings = restaurants.filter(res => 
    res.friendRatings?.some(fr => fr.name === profile.name)
  );

  const countriesExplored = Array.from(new Set(userRatings.map(res => res.country)));
  const averageRating = userRatings.length > 0 
    ? (userRatings.reduce((acc, curr) => {
        const rating = curr.friendRatings?.find(fr => fr.name === profile.name)?.rating || 0;
        return acc + rating;
      }, 0) / userRatings.length).toFixed(1)
    : 0;

  return (
    <MDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-12 md:space-y-16"
    >
      <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 py-8 md:py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-[#2ec4b6] blur-3xl opacity-20 rounded-full" />
          <img 
            src={profile.avatar} 
            alt={profile.name} 
            className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[3rem] border-4 border-[#1a3b38] shadow-2xl relative z-10 bg-[#0d2624]"
          />
        </div>
        
        <div className="space-y-2 px-4">
          <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none break-words">
            {profile.name}
          </h2>
          <p className="text-[#2ec4b6] font-black uppercase tracking-[0.6em] text-[10px] md:text-xs pt-2 md:pt-4">Circle Member</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12 pt-4 md:pt-8 px-4">
          <div className="text-center min-w-[80px]">
            <p className="text-3xl md:text-4xl font-black text-[#ff9f1c]">{userRatings.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cbf3f0]/30">Reviews</p>
          </div>
          <div className="text-center sm:border-x border-white/10 px-4 md:px-12 min-w-[80px]">
            <p className="text-3xl md:text-4xl font-black text-white">{countriesExplored.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cbf3f0]/30">Countries</p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-3xl md:text-4xl font-black text-[#2ec4b6]">{averageRating}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cbf3f0]/30">Avg Score</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 md:space-y-12 px-2">
        <div className="flex flex-col sm:flex-row items-baseline justify-between border-b border-[#1a3b38] pb-4 md:pb-8 gap-2">
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Verified Log</h3>
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/20">All Ratings</span>
        </div>

        {userRatings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {userRatings.map(res => (
              <RestaurantCard 
                key={res.id} 
                restaurant={res} 
                onRate={() => onRate(res)}
                onProfileClick={onProfileClick}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 md:py-24 text-center border-2 border-dashed border-[#1a3b38] rounded-[2rem] md:rounded-[4rem]">
            <p className="text-lg md:text-2xl font-bold text-white/20 uppercase tracking-widest">No restaurants logged yet</p>
          </div>
        )}
      </div>
    </MDiv>
  );
};

export default ProfileView;

