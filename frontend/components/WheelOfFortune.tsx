
import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Restaurant } from '../types';
import { Compass } from 'lucide-react';
import { APP_COLORS } from '../constants';

const MDiv = motion.div as any;

interface WheelOfFortuneProps {
  countries: string[];
  restaurants: Restaurant[];
  onResult: (restaurant: Restaurant) => void;
}

const WheelOfFortune: React.FC<WheelOfFortuneProps> = ({ countries, restaurants, onResult }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();

  const spinWheel = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const randomRotation = Math.floor(Math.random() * 360) + 2160; 
    
    await controls.start({
      rotate: randomRotation,
      transition: { duration: 5, ease: [0.1, 0, 0.1, 1] },
    });

    const finalAngle = randomRotation % 360;
    const sliceAngle = 360 / countries.length;
    const normalizedAngle = (360 - finalAngle) % 360;
    const index = Math.floor(normalizedAngle / sliceAngle);
    
    const winningCountry = countries[index];
    const filtered = restaurants.filter(r => r.country === winningCountry);
    const winningRestaurant = filtered[Math.floor(Math.random() * filtered.length)];

    onResult(winningRestaurant);
    setIsSpinning(false);
    controls.set({ rotate: finalAngle });
  };

  const rainbowColors = APP_COLORS.rainbow;

  return (
    <div className="flex flex-col items-center py-16 bg-[#0d2624] border border-[#1a3b38] rounded-[3rem] shadow-2xl backdrop-blur-sm">
      <div className="text-center mb-12 px-4">
        <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Atlas Destiny</h3>
        <p className="text-[#cbf3f0]/40 text-[10px] font-black uppercase tracking-[0.3em] mt-2">The Circle Selects Your Table</p>
      </div>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-40 w-10 h-10 text-[#ff9f1c] drop-shadow-[0_0_15px_rgba(255,159,28,0.5)]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21l-8-14h16z" />
          </svg>
        </div>
        
        <div className="absolute inset-0 rounded-full blur-3xl bg-[#2ec4b6]/10 animate-pulse" />
        
        <MDiv
          animate={controls}
          className="w-full h-full rounded-full border-[8px] border-[#081c1b] relative overflow-hidden shadow-2xl bg-[#081c1b]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform scale-[1.02]">
            {countries.map((country, i) => {
              const sliceAngle = 360 / countries.length;
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;
              const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
              const largeArc = sliceAngle > 180 ? 1 : 0;

              return (
                <g key={country}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={rainbowColors[i % rainbowColors.length]}
                    className="opacity-90"
                  />
                  <text
                    x="50"
                    y="14"
                    transform={`rotate(${startAngle + sliceAngle / 2}, 50, 50)`}
                    fill="#FFF"
                    fontSize="3"
                    fontWeight="900"
                    textAnchor="middle"
                    className="select-none tracking-tighter uppercase font-black drop-shadow-sm"
                    style={{ fill: rainbowColors[i % rainbowColors.length] === '#ffffff' ? '#081c1b' : '#ffffff' }}
                  >
                    {country}
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="4" fill="#081c1b" stroke="#ff9f1c" strokeWidth="0.5" />
          </svg>
        </MDiv>
      </div>

      <button
        onClick={spinWheel}
        disabled={isSpinning}
        className={`mt-14 px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${
          isSpinning 
            ? 'bg-[#1a3b38] text-white/20 cursor-not-allowed border border-[#1a3b38]' 
            : 'bg-[#ff9f1c] text-[#081c1b] hover:bg-[#ffbf69] border border-transparent'
        }`}
      >
        <Compass size={16} className={isSpinning ? 'animate-spin' : ''} />
        {isSpinning ? 'Selecting...' : 'Spin the wheel'}
      </button>
    </div>
  );
};

export default WheelOfFortune;

