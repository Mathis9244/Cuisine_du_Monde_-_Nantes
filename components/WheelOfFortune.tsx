"use client";

import React, { useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const MDiv = motion.div as any;

interface WheelOfFortuneProps {
  segments: string[];
  excludedSegments?: string[];
  onResult: (segment: string) => void;
}

const SLICE_COLORS: { fill: string; text: string }[] = [
  { fill: "#ff9f1c", text: "#081c1b" },
  { fill: "#2ec4b6", text: "#081c1b" },
  { fill: "#ffbf69", text: "#081c1b" },
  { fill: "#1a3b38", text: "#ffffff" },
  { fill: "#cbf3f0", text: "#081c1b" },
];

const CX = 100;
const CY = 100;
const R = 92;
const HUB_R = 22;

function pointToXY(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}

function formatLabel(seg: string, maxChars: number): string {
  if (seg.length <= maxChars) return seg;
  if (maxChars <= 3) return seg.slice(0, maxChars);
  return `${seg.slice(0, maxChars - 1)}…`;
}

function labelMetrics(count: number) {
  const slice = count > 0 ? 360 / count : 360;
  const labelRadius = R - (count > 20 ? 14 : count > 14 ? 12 : count > 8 ? 11 : 13);
  const fontSize = Math.max(4.5, Math.min(9, 100 / Math.max(count, 1)));
  const arcLen = (slice / 360) * 2 * Math.PI * labelRadius;
  const maxChars = Math.max(3, Math.floor(arcLen / (fontSize * 0.62)) - 1);
  return { labelRadius, fontSize, maxChars, slice };
}

const EXCLUDED_FILL = "#2a3a38";
const EXCLUDED_TEXT = "rgba(203, 243, 240, 0.45)";

const WheelOfFortune: React.FC<WheelOfFortuneProps> = ({
  segments,
  excludedSegments = [],
  onResult,
}) => {
  const { t } = useI18n();
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const controls = useAnimation();

  const excludedSet = useMemo(
    () => new Set(excludedSegments),
    [excludedSegments],
  );

  const activeIndices = useMemo(
    () =>
      segments
        .map((seg, i) => ({ seg, i }))
        .filter(({ seg }) => !excludedSet.has(seg))
        .map(({ i }) => i),
    [segments, excludedSet],
  );

  const count = segments.length;
  const { labelRadius, fontSize: labelFontSize, maxChars, slice } = useMemo(
    () => labelMetrics(count),
    [count],
  );

  const spinWheel = async () => {
    if (isSpinning || activeIndices.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    const pick =
      activeIndices[Math.floor(Math.random() * activeIndices.length)] ?? 0;
    const center = pick * slice + slice / 2;
    const targetMod = (360 - center) % 360;
    const fullSpins = 360 * 6;
    const finalRotation = fullSpins + targetMod;

    await controls.start({
      rotate: finalRotation,
      transition: { duration: 4.5, ease: [0.12, 0, 0.1, 1] },
    });
    controls.set({ rotate: targetMod });

    const won = segments[pick];
    setWinner(won);
    setIsSpinning(false);

    setTimeout(() => onResult(won), 1100);
  };

  const canSpin = !isSpinning && activeIndices.length > 0;

  return (
    <div className="flex w-full flex-col items-center rounded-[2rem] border border-circle-border bg-circle-card px-4 py-8 shadow-xl sm:rounded-[2.5rem] sm:px-6 sm:py-10 md:py-12">
      <div className="mb-6 max-w-sm text-center sm:mb-8">
        <h3 className="text-xl font-black uppercase tracking-[0.18em] text-circle-text sm:text-2xl md:text-3xl md:tracking-[0.2em]">
          {t("wheel.title")}
        </h3>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-circle-frost/45 sm:text-xs sm:tracking-[0.3em]">
          {t("wheel.subtitle")}
        </p>
      </div>

      {/* Mobile-first : largeur fluide, hauteur = largeur */}
      <div className="relative w-full max-w-[min(100%,18.5rem)] sm:max-w-[21rem] md:max-w-[23rem]">
        {/* Pointeur */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div className="flex flex-col items-center">
            <div className="h-0 w-0 border-x-[10px] border-b-[14px] border-x-transparent border-b-circle-amber drop-shadow-[0_2px_8px_rgba(255,159,28,0.45)] sm:border-x-[11px] sm:border-b-[16px]" />
            <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-circle-amber/80" />
          </div>
        </div>

        <MDiv
          animate={controls}
          role="button"
          tabIndex={0}
          aria-label={t("wheel.spin")}
          aria-disabled={!canSpin}
          onClick={spinWheel}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              void spinWheel();
            }
          }}
          className={`relative aspect-square w-full touch-manipulation overflow-hidden rounded-full outline-none transition-shadow ${
            canSpin
              ? "cursor-pointer active:scale-[0.99]"
              : "cursor-not-allowed"
          }`}
          style={{ transformOrigin: "50% 50%" }}
        >
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full drop-shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
            aria-hidden
          >
            <defs>
              <clipPath id="wheel-disc-clip">
                <circle cx={CX} cy={CY} r={R} />
              </clipPath>
            </defs>

            <g clipPath="url(#wheel-disc-clip)">
            {/* Fond disque */}
            <circle cx={CX} cy={CY} r={R + 2} fill="#081c1b" />

            {/* Parts pleines (sans gap angulaire) */}
            {segments.map((seg, i) => {
              const startAngle = i * slice;
              const endAngle = (i + 1) * slice;
              const [x1, y1] = pointToXY(startAngle, R);
              const [x2, y2] = pointToXY(endAngle, R);
              const largeArc = slice > 180 ? 1 : 0;
              const isExcluded = excludedSet.has(seg);
              const color = SLICE_COLORS[i % SLICE_COLORS.length];

              const mid = startAngle + slice / 2;
              const [lx, ly] = pointToXY(mid, labelRadius);
              let rot = mid - 90;
              if (rot > 90) rot -= 180;
              else if (rot < -90) rot += 180;

              return (
                <g key={`${seg}-${i}`} opacity={isExcluded ? 0.55 : 1}>
                  <path
                    d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={isExcluded ? EXCLUDED_FILL : color.fill}
                  />
                  <text
                    x={lx}
                    y={ly}
                    transform={`rotate(${rot} ${lx} ${ly})`}
                    fill={isExcluded ? EXCLUDED_TEXT : color.text}
                    fontSize={labelFontSize}
                    fontWeight={800}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none uppercase"
                    style={{
                      letterSpacing: count > 14 ? "0.02em" : "0.04em",
                    }}
                  >
                    {formatLabel(seg, maxChars)}
                  </text>
                </g>
              );
            })}

            {count > 1 &&
              segments.map((_, i) => {
                const angle = i * slice;
                const [x1, y1] = pointToXY(angle, HUB_R);
                const [x2, y2] = pointToXY(angle, R);
                return (
                  <line
                    key={`sep-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255, 255, 255, 0.14)"
                    strokeWidth={0.5}
                    strokeLinecap="round"
                  />
                );
              })}

            {/* Anneau extérieur */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={1}
            />
            </g>

            {/* Moyeu (au-dessus du clip) */}
            <circle
              cx={CX}
              cy={CY}
              r={HUB_R}
              fill="#081c1b"
              stroke="rgba(255, 159, 28, 0.55)"
              strokeWidth={1.25}
            />
            <circle cx={CX} cy={CY} r={5} fill="#ff9f1c" />
          </svg>

          {/* Anneau interactif subtil */}
          <div
            className={`pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ${
              canSpin ? "ring-white/10" : "ring-white/5"
            }`}
          />
        </MDiv>

        {canSpin && (
          <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.28em] text-circle-frost/35 sm:text-[10px]">
            {t("wheel.tap")}
          </p>
        )}
        {activeIndices.length === 0 && count > 0 && (
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-red-300/80">
            {t("wheel.allExcluded")}
          </p>
        )}
      </div>

      <div className="mt-6 flex min-h-[3.5rem] items-center justify-center sm:mt-8">
        {winner ? (
          <MDiv
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-circle-frost/45">
              {t("wheel.direction")}
            </p>
            <p className="mt-1 text-xl font-black uppercase tracking-tight text-circle-amber sm:text-2xl">
              {winner}
            </p>
          </MDiv>
        ) : isSpinning ? (
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-circle-frost/35">
            {t("wheel.spinning")}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={spinWheel}
        disabled={!canSpin}
        className={`mt-2 flex w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.35em] shadow-lg transition-all active:scale-[0.98] sm:mt-3 sm:max-w-sm sm:py-4 sm:text-[11px] sm:tracking-[0.4em] ${
          canSpin
            ? "bg-circle-amber text-[#081c1b] hover:bg-circle-honey"
            : "cursor-not-allowed bg-circle-border text-circle-text/20"
        }`}
      >
        <Compass size={16} className={isSpinning ? "animate-spin" : ""} />
        {isSpinning ? t("wheel.spinning") : t("wheel.spin")}
      </button>
    </div>
  );
};

export default WheelOfFortune;
