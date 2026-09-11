"use client";

import { motion } from "framer-motion";

interface WebGLFallbackProps {
  inkPercentage: number;
  className?: string;
}

export function WebGLFallback({ inkPercentage, className = "" }: WebGLFallbackProps) {
  const clamp = Math.max(0, Math.min(100, inkPercentage));
  const inkColor =
    clamp > 60 ? "#2563EB" : clamp > 30 ? "#0D9488" : clamp > 10 ? "#F59E0B" : "#EF4444";

  return (
    <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center"
      >
        <svg
          viewBox="0 0 100 380"
          className="w-40 h-[380px] drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* End Plug */}
          <rect x="36" y="20" width="28" height="18" rx="3" fill="#0D1B2A" />
          <rect x="33" y="32" width="34" height="6" rx="2" fill={inkColor} />

          {/* Refill Tube */}
          <rect
            x="35"
            y="38"
            width="30"
            height="260"
            rx="5"
            fill="#EBF4FB"
            fillOpacity="0.35"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Etched Calibration Ticks */}
          {[0, 25, 50, 75, 100].map((t) => {
            const y = 38 + 260 - (t / 100) * 230 - 20;
            return (
              <g key={t}>
                <line x1="33" y1={y} x2="38" y2={y} stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="38" y1={y} x2="65" y2={y} stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="24" y={y + 3} fill="#94A3B8" fontSize="7" fontFamily="sans-serif">
                  {t}%
                </text>
              </g>
            );
          })}

          {/* Liquid Ink Column */}
          {clamp > 0 && (
            <motion.rect
              x="37"
              y={38 + 260 - (clamp / 100) * 230 - 15}
              width="26"
              height={(clamp / 100) * 230 + 15}
              rx="3"
              fill={inkColor}
              initial={false}
              animate={{
                y: 38 + 260 - (clamp / 100) * 230 - 15,
                height: (clamp / 100) * 230 + 15,
                fill: inkColor,
              }}
              transition={{ duration: 0.25 }}
            />
          )}

          {/* Follower Gel */}
          {clamp < 95 && (
            <rect
              x="37"
              y={38 + 260 - (clamp / 100) * 230 - 32}
              width="26"
              height="16"
              rx="3"
              fill="#FDE68A"
              fillOpacity="0.75"
            />
          )}

          {/* Metal Crimp & Tip */}
          <rect x="35.5" y="298" width="29" height="14" rx="2" fill="#94A3B8" />
          <rect x="34" y="306" width="32" height="4" fill="#D4AF37" />
          <rect x="44" y="312" width="12" height="28" fill="#CBD5E1" />
          <path d="M44 340 L50 365 L56 340 Z" fill="#94A3B8" />
          <circle cx="50" cy="365" r="2.5" fill={inkColor} />
        </svg>

        <span className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-ink-navy/80 text-white shadow">
          {Math.round(clamp)}% ink level
        </span>
      </motion.div>
    </div>
  );
}
