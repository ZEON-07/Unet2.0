"use client";

import { useEffect, useState } from "react";
import { useInkMode } from "@/components/providers/InkModeProvider";

export function EditorialFrame() {
  const [timeString, setTimeString] = useState<string>("");
  const [cityCode, setCityCode] = useState<string>("UTC");
  const [scrollPct, setScrollPct] = useState<number>(0);
  const { mode } = useInkMode();

  useEffect(() => {
    // Determine timezone abbreviation or city code
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = tz.split("/");
      const city = parts[parts.length - 1].replace("_", " ").substring(0, 3).toUpperCase();
      setCityCode(city || "LAB");
    } catch {
      setCityCode("LAB");
    }

    const updateClock = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
        setScrollPct(pct);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      {/* ── Viewport Outer Border Box (12px inset on desktop) ── */}
      <div className="absolute inset-2 md:inset-4 border border-[var(--line)] pointer-events-none transition-colors duration-500">
        {/* Top-Left Bracket */}
        <div className="absolute -top-1.5 -left-1.5 flex items-center justify-center w-3 h-3 text-[9px] font-mono text-[var(--muted)] bg-[var(--background)]">
          +
        </div>

        {/* Top-Right Bracket */}
        <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3 h-3 text-[9px] font-mono text-[var(--muted)] bg-[var(--background)]">
          +
        </div>

        {/* Bottom-Left Bracket */}
        <div className="absolute -bottom-1.5 -left-1.5 flex items-center justify-center w-3 h-3 text-[9px] font-mono text-[var(--muted)] bg-[var(--background)]">
          +
        </div>

        {/* Bottom-Right Bracket */}
        <div className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-3 h-3 text-[9px] font-mono text-[var(--muted)] bg-[var(--background)]">
          +
        </div>

        {/* Left Side Coordinate Marker */}
        <div className="hidden lg:flex absolute top-1/2 -left-3 -translate-y-1/2 flex-col items-center gap-1 bg-[var(--background)] py-1">
          <span className="text-[8px] font-mono tracking-widest text-[var(--muted)] rotate-90 origin-center">
            SYS.01
          </span>
          <span className="w-1 h-1 bg-[var(--ink-blue)] rounded-full animate-pulse mt-1" />
        </div>

        {/* Right Edge: Vertical Scroll Progress Indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-[var(--line)]">
          <div
            className="w-full bg-[var(--ink-blue)] transition-all duration-100 ease-out"
            style={{ height: `${scrollPct}%` }}
          />
        </div>

        {/* Bottom Status Bar Metadata */}
        <div className="absolute bottom-1 left-3 right-4 flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-[var(--muted)] tracking-wider">
          <div className="flex items-center gap-3">
            <span>INKLIFE® / LAB-V2</span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span className="hidden sm:inline">MODE: {mode.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">CALIBRATION: 0.85 REAL_EFF</span>
            <span className="hidden md:inline opacity-40">•</span>
            <span>SCR {Math.round(scrollPct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
