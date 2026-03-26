
import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { Restaurant } from '../types';

interface CountryListViewProps {
  countries: string[];
  restaurants: Restaurant[];
  onSelectCountry: (country: string) => void;
}

const MDiv = motion.div as any;

const CountryListView: React.FC<CountryListViewProps> = ({ countries, restaurants, onSelectCountry }) => {
  return (
    <MDiv 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-12 md:space-y-16"
    >
      <div className="text-center space-y-4 py-8 md:py-12">
        <h2 className="text-5xl md:text-8xl font-black text-[#ff9f1c] tracking-tighter uppercase leading-none">
          Atlas
        </h2>
        <p className="text-[#cbf3f0]/40 font-black uppercase tracking-[0.6em] text-[10px] md:text-xs">Explore the Collective Map</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-2">
        {countries.map(country => {
          const count = restaurants.filter(r => r.country === country).length;
          return (
            <button 
              key={country}
              onClick={() => onSelectCountry(country)}
              className="bg-[#0d2624] border border-[#1a3b38] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-left transition-all hover:bg-[#153d3a] hover:border-[#2ec4b6] group flex justify-between items-center"
            >
              <div>
                <h4 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase group-hover:scale-105 transition-transform origin-left">
                  {country}
                </h4>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#cbf3f0]/30 mt-1 md:mt-2">
                  {count} Verified Spot{count > 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#081c1b] rounded-xl md:rounded-2xl flex items-center justify-center border border-[#1a3b38] opacity-20 group-hover:opacity-100 transition-all text-[#2ec4b6]">
                <Globe size={20} className="md:size-[24px]" />
              </div>
            </button>
          );
        })}
      </div>
    </MDiv>
  );
};

export default CountryListView;

