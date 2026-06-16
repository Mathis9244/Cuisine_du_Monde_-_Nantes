"use client";

import React, { useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MDiv = motion.div as any;

interface WheelOfFortuneProps {
  /** Types de cuisine affichés sur la roue (ex: Japan, Italy, ...). */
  segments: string[];
  /** Appelé avec le type tiré (pour rediriger vers le feed filtré). */
  onResult: (segment: string) => void;
}

// Palette des parts (couleurs fixes, décoratives) + couleur de texte contrastée.
const SLICE_COLORS: { fill: string; text: string }[] = [
  { fill: "#ff9f1c", text: "#081c1b" },
  { fill: "#2ec4b6", text: "#081c1b" },
  { fill: "#ffbf69", text: "#081c1b" },
  { fill: "#1a3b38", text: "#ffffff" },
  { fill: "#cbf3f0", text: "#081c1b" },
];

const CX = 100;
const CY = 100;
const R = 96;

function pointToXY(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}

const WheelOfFortune: React.FC<WheelOfFortuneProps> = ({
  segments,
  onResult,
}) => {
  const { t } = useI18n();
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const controls = useAnimation();

  const count = segments.length;
  const slice = count > 0 ? 360 / count : 360;

  const labelFontSize = useMemo(
    () => Math.max(5.5, Math.min(10, 120 / Math.max(count, 1))),
    [count],
  );

  const spinWheel = async () => {
    if (isSpinning || count === 0) return;
    setIsSpinning(true);
    setWinner(null);

    // On choisit d'abord l'index gagnant, puis on calcule la rotation exacte
    // pour qu'il s'arrête sous le curseur (haut). Garantit l'exactitude visuelle.
    const winningIndex = Math.floor(Math.random() * count);
    const center = winningIndex * slice + slice / 2;
    const targetMod = (360 - center) % 360;
    const fullSpins = 360 * 6;
    const finalRotation = fullSpins + targetMod;

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 4.5, ease: [0.12, 0, 0.1, 1] },
    });
    controls.set({ rotate: targetMod });

    const won = segments[winningIndex];
    setWinner(won);
    setIsSpinning(false);

    // Petite pause pour laisser voir le résultat, puis redirection vers le feed.
    setTimeout(() => onResult(won), 1100);
  };

  return (
    <div className="flex flex-col items-center py-12 md:py-16 bg-circle-card border border-circle-border rounded-[3rem] shadow-2xl">
      <div className="text-center mb-10 px-4">
        <h3 className="text-2xl md:text-3xl font-black text-circle-text uppercase tracking-[0.2em]">
          {t("wheel.title")}
        </h3>
        <p className="text-circle-frost/50 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-2">
          {t("wheel.subtitle")}
        </p>
      </div>

      <div className="relative w-[18rem] h-[18rem] sm:w-[22rem] sm:h-[22rem]">
        {/* Curseur (haut) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-40 w-9 h-9 text-circle-amber drop-shadow-[0_0_12px_rgba(255,159,28,0.6)]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22 L3 5 h18 z" />
          </svg>
        </div>

        <div className="absolute inset-0 rounded-full blur-3xl bg-circle-teal/10 animate-pulse" />

        <MDiv
          animate={controls}
          className="w-full h-full rounded-full relative overflow-hidden shadow-2xl ring-4 ring-circle-border"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <g transform="scale(1)">
              {segments.map((seg, i) => {
                const startAngle = i * slice;
                const endAngle = (i + 1) * slice;
                const [x1, y1] = pointToXY(startAngle, R);
                const [x2, y2] = pointToXY(endAngle, R);
                const largeArc = slice > 180 ? 1 : 0;
                const color = SLICE_COLORS[i % SLICE_COLORS.length];

                const mid = startAngle + slice / 2;
                const [lx, ly] = pointToXY(mid, R * 0.62);
                let rot = mid - 90;
                if (rot > 90) rot -= 180;
                else if (rot < -90) rot += 180;

                const label =
                  seg.length > 12 ? `${seg.slice(0, 11)}…` : seg;

                return (
                  <g key={`${seg}-${i}`}>
                    <path
                      d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={color.fill}
                      stroke="#081c1b"
                      strokeWidth={0.6}
                    />
                    <text
                      x={lx}
                      y={ly}
                      transform={`rotate(${rot} ${lx} ${ly})`}
                      fill={color.text}
                      fontSize={labelFontSize}
                      fontWeight={900}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="select-none uppercase"
                      style={{ letterSpacing: "0.02em" }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
            {/* Moyeu central */}
            <circle cx={CX} cy={CY} r="10" fill="#081c1b" stroke="#ff9f1c" strokeWidth="1.5" />
            <circle cx={CX} cy={CY} r="3.5" fill="#ff9f1c" />
          </svg>
        </MDiv>
      </div>

      <div className="h-12 mt-8 flex items-center justify-center">
        {winner && (
          <MDiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-circle-frost/50">
              {t("wheel.direction")}
            </p>
            <p className="text-2xl font-black uppercase tracking-tighter text-circle-amber">
              {winner}
            </p>
          </MDiv>
        )}
      </div>

      <button
        onClick={spinWheel}
        disabled={isSpinning || count === 0}
        className={`mt-4 px-12 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${
          isSpinning || count === 0
            ? "bg-circle-border text-circle-text/20 cursor-not-allowed"
            : "bg-circle-amber text-[#081c1b] hover:bg-circle-honey"
        }`}
      >
        <Compass size={16} className={isSpinning ? "animate-spin" : ""} />
        {isSpinning ? t("wheel.spinning") : t("wheel.spin")}
      </button>
    </div>
  );
};

export default WheelOfFortune;
