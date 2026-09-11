"use client";

import { motion } from "framer-motion";

interface PenInkIllustrationProps {
  /** Ink level from 0 (empty) to 100 (full) */
  inkPercentage: number;
  /** Width of the SVG container. Height scales proportionally. */
  size?: number;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show the animated ink drop particles */
  showParticles?: boolean;
}

export function PenInkIllustration({
  inkPercentage,
  size = 280,
  className = "",
  showParticles = true,
}: PenInkIllustrationProps) {
  const clampedInk = Math.max(0, Math.min(100, inkPercentage));

  // Ink tube dimensions within the SVG viewBox (0 0 120 320)
  const tubeTop = 60;
  const tubeBottom = 230;
  const tubeHeight = tubeBottom - tubeTop;
  const inkHeight = (clampedInk / 100) * tubeHeight;
  const inkY = tubeBottom - inkHeight;

  // Color interpolation: blue (full) → mint (half) → orange (low)
  const getInkColor = (pct: number) => {
    if (pct > 60) return "#2563EB";
    if (pct > 30) return "#7DE2D1";
    if (pct > 10) return "#F59E0B";
    return "#EF4444";
  };

  const inkColor = getInkColor(clampedInk);
  const inkColorLight =
    clampedInk > 60
      ? "#3B82F6"
      : clampedInk > 30
        ? "#A7F3D0"
        : clampedInk > 10
          ? "#FBBF24"
          : "#F87171";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 120 320"
        width={size}
        height={(size / 120) * 320}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        role="img"
        aria-label={`Pen with ${clampedInk}% ink remaining`}
      >
        <defs>
          {/* Ink gradient */}
          <linearGradient id="inkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={inkColorLight} stopOpacity={0.9} />
            <stop offset="100%" stopColor={inkColor} stopOpacity={1} />
          </linearGradient>

          {/* Pen body gradient — transparent/glass effect */}
          <linearGradient id="penBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E8E4DC" stopOpacity={0.6} />
            <stop offset="30%" stopColor="#F5F0E8" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.5} />
            <stop offset="70%" stopColor="#F5F0E8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#E0DCD4" stopOpacity={0.6} />
          </linearGradient>

          {/* Clip for ink inside tube */}
          <clipPath id="tubeClip">
            <rect x="44" y={tubeTop} width="32" height={tubeHeight} rx="4" />
          </clipPath>

          {/* Subtle shadow filter */}
          <filter id="penShadow" x="-20%" y="-5%" width="140%" height="110%">
            <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#0D1B2A" floodOpacity="0.12" />
          </filter>

          {/* Glow for ink */}
          <filter id="inkGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Pen cap (top) ─────────────────────────────────── */}
        <rect
          x="38"
          y="8"
          width="44"
          height="42"
          rx="8"
          fill="#0D1B2A"
          opacity={0.9}
        />
        {/* Cap clip detail */}
        <rect x="54" y="4" width="12" height="8" rx="3" fill="#1B2D45" />
        {/* Cap highlight */}
        <rect x="48" y="16" width="3" height="24" rx="1.5" fill="#FFFFFF" opacity={0.15} />

        {/* ── Pen body (transparent barrel) ──────────────────── */}
        <rect
          x="40"
          y="50"
          width="40"
          height="196"
          rx="6"
          fill="url(#penBody)"
          stroke="#D6D3CE"
          strokeWidth="1.5"
          filter="url(#penShadow)"
        />

        {/* Body highlight streak */}
        <rect x="50" y="56" width="4" height="180" rx="2" fill="#FFFFFF" opacity={0.25} />
        <rect x="66" y="56" width="2" height="180" rx="1" fill="#FFFFFF" opacity={0.12} />

        {/* ── Ink tube (visible through barrel) ──────────────── */}
        <rect
          x="44"
          y={tubeTop}
          width="32"
          height={tubeHeight}
          rx="4"
          fill="#F5F0E8"
          stroke="#E0DCD4"
          strokeWidth="0.5"
          opacity={0.5}
        />

        {/* Animated ink fill */}
        <g clipPath="url(#tubeClip)">
          <motion.rect
            x="44"
            width="32"
            rx="4"
            fill="url(#inkGradient)"
            filter="url(#inkGlow)"
            initial={{ y: tubeBottom, height: 0 }}
            animate={{ y: inkY, height: inkHeight }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Ink surface meniscus */}
          <motion.ellipse
            cx="60"
            rx="14"
            ry="3"
            fill={inkColorLight}
            opacity={0.5}
            initial={{ cy: tubeBottom }}
            animate={{ cy: inkY + 2 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Subtle bubble when ink is low */}
          {clampedInk < 40 && clampedInk > 5 && (
            <motion.circle
              cx="55"
              r="2"
              fill="#FFFFFF"
              opacity={0.4}
              initial={{ cy: tubeBottom - 10 }}
              animate={{
                cy: [inkY + inkHeight * 0.7, inkY + inkHeight * 0.3],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          )}
        </g>

        {/* ── Grip section ──────────────────────────────────── */}
        <rect x="42" y="240" width="36" height="24" rx="4" fill="#C4B8A8" opacity={0.7} />
        {/* Grip lines */}
        {[244, 250, 256].map((y) => (
          <line
            key={y}
            x1="46"
            y1={y}
            x2="74"
            y2={y}
            stroke="#A89880"
            strokeWidth="0.8"
            opacity={0.6}
          />
        ))}

        {/* ── Nib (tip) ─────────────────────────────────────── */}
        <path
          d="M 48 264 L 60 308 L 72 264 Z"
          fill="#B8A898"
          stroke="#A89880"
          strokeWidth="0.5"
        />
        {/* Nib metallic tip */}
        <path
          d="M 54 290 L 60 310 L 66 290 Z"
          fill="#8B7D6B"
        />
        {/* Writing point */}
        <circle cx="60" cy="312" r="1.5" fill={inkColor} opacity={0.9} />

        {/* ── Percentage label ────────────────────────────────── */}
        <text
          x="60"
          y={Math.max(inkY - 8, tubeTop - 2)}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill={inkColor}
          opacity={0.9}
        >
          {clampedInk}%
        </text>
      </motion.svg>

      {/* ── Ink drop particles ─────────────────────────────── */}
      {showParticles && clampedInk <= 25 && clampedInk > 0 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + i * 2,
                height: 4 + i * 2,
                backgroundColor: inkColor,
                left: (i - 1) * 12,
              }}
              animate={{
                y: [0, 20, 40],
                opacity: [0.6, 0.3, 0],
                scale: [1, 0.8, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
