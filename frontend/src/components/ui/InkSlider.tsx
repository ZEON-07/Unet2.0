"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets } from "lucide-react";

interface InkSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const INK_LEVELS = [
  { label: "Empty", emoji: "🔴", range: [0, 15], color: "#EF4444" },
  { label: "Low", emoji: "🟠", range: [15, 40], color: "#F59E0B" },
  { label: "Half Full", emoji: "🟡", range: [40, 65], color: "#0D9488" },
  { label: "Healthy", emoji: "🟢", range: [65, 85], color: "#2563EB" },
  { label: "Full", emoji: "✨", range: [85, 100], color: "#1D4ED8" },
];

function getInkLevel(pct: number) {
  return (
    INK_LEVELS.find(({ range }) => pct >= range[0] && pct <= range[1]) ??
    INK_LEVELS[3]
  );
}

export function InkSlider({ value, onChange, disabled }: InkSliderProps) {
  const level = getInkLevel(value);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getValueFromEvent = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return Math.round((x / rect.width) * 100);
    },
    [value]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      onChange(getValueFromEvent(e.clientX));
    },
    [disabled, getValueFromEvent, onChange]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      onChange(getValueFromEvent(e.clientX));
    },
    [isDragging, getValueFromEvent, onChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* ── Status badge ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={level.emoji}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="text-2xl"
            >
              {level.emoji}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={level.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="text-sm font-semibold"
              style={{ color: level.color }}
            >
              {level.label}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.div
          key={value}
          initial={{ scale: 1.3, color: level.color }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-white/60 border border-ink-border/40"
          style={{ color: level.color }}
        >
          <Droplets className="w-3.5 h-3.5" />
          {value}%
        </motion.div>
      </div>

      {/* ── Track ── */}
      <div className="relative">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative h-6 rounded-full cursor-pointer select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-label="Ink percentage"
          tabIndex={0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "ArrowLeft") onChange(Math.max(0, value - 1));
            if (e.key === "ArrowRight") onChange(Math.min(100, value + 1));
          }}
        >
          {/* Background track */}
          <div className="absolute inset-0 rounded-full bg-ink-border/30" />

          {/* Colored fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${value}%`, backgroundColor: level.color }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              background: `linear-gradient(90deg, ${level.color}88, ${level.color})`,
              boxShadow: `0 0 12px ${level.color}55`,
            }}
          />

          {/* Tick marks */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            {[0, 25, 50, 75, 100].map((tick) => (
              <div
                key={tick}
                className="w-0.5 h-2 rounded-full bg-white/40"
                style={{ marginLeft: tick === 0 ? 0 : undefined }}
              />
            ))}
          </div>

          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg border-2 flex items-center justify-center"
            animate={{
              left: `${value}%`,
              borderColor: level.color,
              boxShadow: isDragging
                ? `0 0 0 4px ${level.color}30, 0 4px 12px rgba(0,0,0,0.15)`
                : `0 2px 8px rgba(0,0,0,0.15)`,
              scale: isDragging ? 1.15 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: level.color }}
            />
          </motion.div>
        </div>

        {/* Percentage labels */}
        <div className="flex justify-between text-xs text-ink-muted/50 mt-1.5 px-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
