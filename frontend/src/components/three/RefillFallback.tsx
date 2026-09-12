"use client";

import React, { useRef } from "react";

export interface RefillFallbackProps {
  inkPercentage: number;
  onInkChange?: (percentage: number) => void;
  interactive?: boolean;
  className?: string;
  isDarkAnalysisMode?: boolean;
}

export function RefillFallback({
  inkPercentage,
  onInkChange,
  interactive = true,
  className = "",
  isDarkAnalysisMode = false,
}: RefillFallbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clampPct = Math.max(0, Math.min(100, inkPercentage));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !onInkChange || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const updateFromY = (clientY: number) => {
      // Inverted since tip is at bottom
      const relY = (rect.bottom - clientY) / rect.height;
      const pct = Math.round(Math.max(0, Math.min(100, relY * 100)));
      onInkChange(pct);
    };

    updateFromY(e.clientY);

    const onPointerMove = (ev: PointerEvent) => {
      updateFromY(ev.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const inkColor = isDarkAnalysisMode ? "#4D78FF" : "#0047E1";
  const strokeColor = isDarkAnalysisMode ? "rgba(255,255,255,0.25)" : "rgba(11,15,20,0.25)";
  const textColor = isDarkAnalysisMode ? "#A3A69F" : "#6B6F76";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={`relative w-44 h-96 mx-auto flex items-center justify-center select-none font-mono ${
        interactive ? "cursor-ns-resize" : ""
      } ${className}`}
      title="3D Fallback: Drag to adjust ink level"
      role="slider"
      aria-valuenow={clampPct}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!onInkChange) return;
        if (e.key === "ArrowUp") onInkChange(Math.min(100, clampPct + 1));
        if (e.key === "ArrowDown") onInkChange(Math.max(0, clampPct - 1));
      }}
    >
      <svg
        viewBox="0 0 100 360"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Technical crosshairs & ticks */}
        <line x1="10" y1="30" x2="25" y2="30" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="10" y1="105" x2="20" y2="105" stroke={strokeColor} strokeWidth="0.5" />
        <line x1="10" y1="180" x2="25" y2="180" stroke={strokeColor} strokeWidth="0.8" />
        <line x1="10" y1="255" x2="20" y2="255" stroke={strokeColor} strokeWidth="0.5" />
        <line x1="10" y1="330" x2="25" y2="330" stroke={strokeColor} strokeWidth="0.8" />

        <text x="2" y="32" fill={textColor} fontSize="6" textAnchor="end">
          100%
        </text>
        <text x="2" y="182" fill={textColor} fontSize="6" textAnchor="end">
          50%
        </text>
        <text x="2" y="332" fill={textColor} fontSize="6" textAnchor="end">
          0%
        </text>

        {/* Outer Transparent Refill Barrel */}
        <rect
          x="35"
          y="20"
          width="30"
          height="300"
          rx="2"
          fill={isDarkAnalysisMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
          stroke={strokeColor}
          strokeWidth="1.2"
        />

        {/* Top Rear Plug */}
        <rect
          x="36.5"
          y="15"
          width="27"
          height="10"
          rx="1"
          fill={isDarkAnalysisMode ? "#1E293B" : "#CBD5E1"}
          stroke={strokeColor}
          strokeWidth="0.8"
        />

        {/* Bottom Metal Tip (points downward) */}
        <polygon
          points="35,320 65,320 54,348 50,355 46,348"
          fill={isDarkAnalysisMode ? "#334155" : "#64748B"}
          stroke={strokeColor}
          strokeWidth="1"
        />
        {/* Tungsten carbide sphere */}
        <circle cx="50" cy="355" r="2.5" fill="#E2E8F0" />

        {/* Internal Ink Liquid Column (anchored at bottom y=320, extends upwards) */}
        {clampPct > 0 && (
          <rect
            x="39"
            y={320 - (clampPct / 100) * 290}
            width="22"
            height={(clampPct / 100) * 290}
            fill={inkColor}
            opacity={0.88}
          />
        )}

        {/* Viscous Follower Plug / Meniscus Line */}
        {clampPct > 0 && (
          <rect
            x="38"
            y={Math.max(22, 320 - (clampPct / 100) * 290 - 4)}
            width="24"
            height="4"
            fill={isDarkAnalysisMode ? "#94A3B8" : "#CBD5E1"}
            opacity={0.7}
          />
        )}
      </svg>

      {/* Floating Percentage Badge */}
      <div
        className="absolute right-0 text-[10px] font-bold px-2 py-1 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] pointer-events-none shadow-xs"
        style={{
          top: `${Math.max(5, Math.min(88, 100 - clampPct))}%`,
        }}
      >
        {clampPct}%
      </div>
    </div>
  );
}
