"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefillFallback } from "@/components/three/RefillFallback";
import { Droplet, Sliders, Scan, Check, Play, Zap } from "lucide-react";

export interface InkLifeLoaderProps {
  onComplete: (calibratedInk?: number) => void;
  forcePlay?: boolean;
  initialInkLevel?: number;
}

export function InkLifeLoader({
  onComplete,
  forcePlay = false,
  initialInkLevel = 65,
}: InkLifeLoaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [manualInk, setManualInk] = useState<number | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [isPumping, setIsPumping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<"tip" | "column" | "seal" | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pumpIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derive active ink level: manual if user interacted, otherwise synced to progress (0% -> 65%)
  const activeInkLevel = useMemo(() => {
    if (manualInk !== null) return manualInk;
    return Math.min(65, Math.round((progress / 100) * 65));
  }, [manualInk, progress]);

  // Derived phase & status (pure computations, 0 re-renders)
  const { statusText, techPhase } = useMemo(() => {
    if (isManual) {
      return {
        statusText: `MANUAL CALIBRATION • CALIBRATED LEVEL: ${activeInkLevel}%`,
        techPhase: "USER OVERRIDE / LIVE",
      };
    }
    if (progress < 25) {
      return {
        statusText: "OPTICAL SCANNING • TRANSPARENT POLYMER BARREL",
        techPhase: "CALIBRATION 01/04",
      };
    }
    if (progress < 50) {
      return {
        statusText: "INK CHANNEL LOCATED • DOCKING INJECTOR NOZZLE",
        techPhase: "CALIBRATION 02/04",
      };
    }
    if (progress < 85) {
      return {
        statusText: `INJECTING SAMPLE FLUID • FLOW: ${activeInkLevel}% VOL`,
        techPhase: "CALIBRATION 03/04",
      };
    }
    return {
      statusText: "CALIBRATION VERIFIED • READY FOR ESTIMATION LAB",
      techPhase: "CALIBRATION 04/04",
    };
  }, [isManual, progress, activeInkLevel]);

  // High-performance progress timer (discrete 25ms tick instead of 60fps React state churn)
  useEffect(() => {
    if (isManual) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-transition when sequence naturally finishes
          setTimeout(() => {
            setIsVisible(false);
            onComplete(65);
          }, 350);
          return 100;
        }
        return prev + 1.25;
      });
    }, 28); // ~2.2s total smooth sequence

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isManual, onComplete]);

  // Manual ink slider handler
  const handleInkChange = useCallback((val: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsManual(true);
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setManualInk(clamped);
    setProgress(clamped);
  }, []);

  // Quick preset button
  const handlePreset = (val: number) => {
    handleInkChange(val);
  };

  // Trigger laser scan
  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 900);
  };

  // Hold-to-pump dispenser
  const startPumping = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsManual(true);
    setIsPumping(true);

    if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
    pumpIntervalRef.current = setInterval(() => {
      setManualInk((prev) => {
        const current = prev ?? activeInkLevel;
        const next = Math.min(100, current + 2);
        setProgress(next);
        return next;
      });
    }, 40);
  };

  const stopPumping = () => {
    setIsPumping(false);
    if (pumpIntervalRef.current) {
      clearInterval(pumpIntervalRef.current);
      pumpIntervalRef.current = null;
    }
  };

  // Finish and enter lab
  const handleEnterLab = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pumpIntervalRef.current) clearInterval(pumpIntervalRef.current);
    setIsVisible(false);
    onComplete(activeInkLevel);
  };

  // Real-time calculated metrics during loader
  const calculatedMeters = Math.round(activeInkLevel * 30);
  const calculatedPages = Math.round(activeInkLevel * 0.47);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="inklife-optimized-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#F5F4EF] text-[#0B0F14] p-4 sm:p-8 select-none overflow-y-auto lab-grid"
        >
          {/* ── Top Header ── */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 w-full max-w-7xl mx-auto border-b border-[rgba(11,15,20,0.15)] pb-3 font-mono text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-extrabold tracking-tight text-sm text-[var(--foreground)]">
                മഷി ഉണ്ടോ മാഷേ ?
              </span>
              <span className="text-[rgba(11,15,20,0.4)]">/</span>
              <span className="tracking-wider uppercase text-[#225CFF] font-bold">
                INK CALIBRATION BENCH
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block px-2 py-0.5 border border-[rgba(11,15,20,0.2)] text-[10px] text-[rgba(11,15,20,0.6)]">
                {techPhase}
              </span>
              <button
                type="button"
                onClick={handleEnterLab}
                className="px-3.5 py-1.5 border border-[#0B0F14] bg-[#0B0F14] text-[#FFFFFF] hover:bg-[#225CFF] hover:border-[#225CFF] transition-all text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
              >
                <span>ENTER LAB</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* ── Center Stage: Interactive Refill & Telemetry ── */}
          <div className="relative flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 py-4">
            {/* Left Telemetry & Real-Time Calculations */}
            <div className="w-full lg:w-72 font-mono text-[11px] space-y-4 border-l-2 border-[rgba(11,15,20,0.2)] pl-4">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-[rgba(11,15,20,0.5)]">
                  ESTIMATED REACH
                </div>
                <div className="text-xl font-extrabold text-[#225CFF] tracking-tight">
                  ~{calculatedMeters.toLocaleString()} M
                </div>
                <div className="text-[9px] text-[rgba(11,15,20,0.5)] mt-0.5">
                  {(calculatedMeters / 1000).toFixed(2)} KM CONTINUOUS LINE
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-wider text-[rgba(11,15,20,0.5)]">
                  NOTEBOOK YIELD
                </div>
                <div className="text-lg font-bold text-[#0B0F14]">
                  ~{calculatedPages} PAGES
                </div>
                <div className="text-[9px] text-[rgba(11,15,20,0.5)]">
                  STANDARD KING / QUEEN FORMAT
                </div>
              </div>

              {/* Hotspot Diagnostic Details */}
              <div className="pt-2 border-t border-[rgba(11,15,20,0.15)] space-y-2">
                <div className="text-[9px] uppercase tracking-widest text-[rgba(11,15,20,0.4)]">
                  INSPECT SPECIMEN
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(activeHotspot === "tip" ? null : "tip")}
                    className={`px-2 py-1 text-[9px] border transition-all cursor-pointer ${
                      activeHotspot === "tip"
                        ? "border-[#225CFF] bg-[#225CFF] text-white"
                        : "border-[rgba(11,15,20,0.2)] hover:border-[#0B0F14] bg-white"
                    }`}
                  >
                    01 TIP
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(activeHotspot === "column" ? null : "column")}
                    className={`px-2 py-1 text-[9px] border transition-all cursor-pointer ${
                      activeHotspot === "column"
                        ? "border-[#225CFF] bg-[#225CFF] text-white"
                        : "border-[rgba(11,15,20,0.2)] hover:border-[#0B0F14] bg-white"
                    }`}
                  >
                    02 FLUID
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(activeHotspot === "seal" ? null : "seal")}
                    className={`px-2 py-1 text-[9px] border transition-all cursor-pointer ${
                      activeHotspot === "seal"
                        ? "border-[#225CFF] bg-[#225CFF] text-white"
                        : "border-[rgba(11,15,20,0.2)] hover:border-[#0B0F14] bg-white"
                    }`}
                  >
                    03 SEAL
                  </button>
                </div>

                {activeHotspot && (
                  <div className="p-2.5 border border-[rgba(11,15,20,0.15)] bg-white/90 text-[10px] space-y-1 mt-2 shadow-xs">
                    {activeHotspot === "tip" && (
                      <>
                        <div className="font-bold text-[#0B0F14]">TUNGSTEN CARBIDE 1.0MM</div>
                        <div className="text-[9px] text-[rgba(11,15,20,0.7)]">
                          High-precision spherical rollerball with brass shoulder crimp. Zero ink leak tolerance.
                        </div>
                      </>
                    )}
                    {activeHotspot === "column" && (
                      <>
                        <div className="font-bold text-[#0B0F14]">HIGH-DENSITY INK PASTE</div>
                        <div className="text-[9px] text-[rgba(11,15,20,0.7)]">
                          Viscous ballpoint ink with anti-smear synthetic lubricant. Current level: {activeInkLevel}%.
                        </div>
                      </>
                    )}
                    {activeHotspot === "seal" && (
                      <>
                        <div className="font-bold text-[#0B0F14]">SILICONE AIR-SEAL STOPPER</div>
                        <div className="text-[9px] text-[rgba(11,15,20,0.7)]">
                          Polyethylene pressure plug preventing atmospheric fluid vaporization and back-flow drying.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Central Interactive Refill Visualizer */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Interaction Callout Banner */}
              <div className="mb-2 px-3 py-1 border border-[#225CFF]/30 bg-[#225CFF]/10 text-[#225CFF] text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 rounded-full">
                <Sliders className="w-3 h-3" />
                <span>DRAG REFILL TO SET INK LEVEL</span>
              </div>

              <div className="relative z-10 flex items-center justify-center">
                <RefillFallback
                  inkPercentage={activeInkLevel}
                  onInkChange={handleInkChange}
                  interactive={true}
                  className="scale-105 sm:scale-115"
                />

                {/* Laser scan line overlay (pure CSS hardware accelerated) */}
                {isScanning && (
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-[#225CFF] shadow-[0_0_12px_#225CFF] pointer-events-none z-30"
                    style={{
                      animation: "loaderLaserScan 0.9s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Interactive Controls Panel */}
            <div className="w-full lg:w-72 font-mono text-[11px] space-y-4 border-r-2 border-[rgba(11,15,20,0.2)] pr-4 text-right">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-[rgba(11,15,20,0.5)]">
                  CALIBRATED LEVEL
                </div>
                <div className="text-2xl font-extrabold text-[#0B0F14]">
                  {activeInkLevel}%
                </div>
                <div className="text-[9px] text-[rgba(11,15,20,0.5)]">
                  {activeInkLevel > 60 ? "OPTIMAL CHARGE" : activeInkLevel > 20 ? "MODERATE CAPACITY" : "CRITICAL LOW"}
                </div>
              </div>

              {/* Quick Fill Presets */}
              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-widest text-[rgba(11,15,20,0.4)]">
                  QUICK PRESETS
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {[15, 35, 65, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePreset(val)}
                      className={`px-2.5 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
                        activeInkLevel === val
                          ? "border-[#225CFF] bg-[#225CFF] text-white"
                          : "border-[rgba(11,15,20,0.2)] hover:border-[#0B0F14] bg-white"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Hold to Pump & Optical Scan Buttons */}
              <div className="space-y-2 pt-2 border-t border-[rgba(11,15,20,0.15)]">
                <button
                  type="button"
                  onMouseDown={startPumping}
                  onMouseUp={stopPumping}
                  onMouseLeave={stopPumping}
                  onTouchStart={startPumping}
                  onTouchEnd={stopPumping}
                  className={`w-full py-2 px-3 text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase select-none ${
                    isPumping
                      ? "bg-[#225CFF] text-white border-[#225CFF] scale-95"
                      : "bg-[#0B0F14] text-white border-[#0B0F14] hover:bg-[#225CFF] hover:border-[#225CFF]"
                  }`}
                  title="Hold mouse or touch to pump fluid into refill"
                >
                  <Droplet className={`w-3.5 h-3.5 ${isPumping ? "animate-bounce" : ""}`} />
                  <span>{isPumping ? "DISPENSING INK..." : "HOLD TO PUMP INK"}</span>
                </button>

                <button
                  type="button"
                  onClick={triggerScan}
                  className="w-full py-1.5 px-3 text-[10px] font-bold border border-[rgba(11,15,20,0.3)] bg-white hover:border-[#0B0F14] text-[#0B0F14] transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <Scan className="w-3 h-3 text-[#225CFF]" />
                  <span>OPTICAL LASER SCAN</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom Technical Telemetry & Action Bar ── */}
          <div className="relative z-20 w-full max-w-7xl mx-auto font-mono pt-3 border-t border-[rgba(11,15,20,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPumping ? "bg-[#225CFF] animate-ping" : "bg-[#225CFF]"}`} />
                <span className="font-bold tracking-wider uppercase text-[#0B0F14]">
                  {statusText}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[rgba(11,15,20,0.6)]">
                  CALIBRATED: <strong className="text-[#225CFF]">{activeInkLevel}%</strong>
                </span>
                <button
                  type="button"
                  onClick={handleEnterLab}
                  className="px-3 py-1 bg-[#225CFF] text-white font-bold text-[10px] tracking-wider uppercase hover:bg-[#1B4CD9] transition-all cursor-pointer shadow-xs flex items-center gap-1 active:scale-95"
                >
                  <Check className="w-3 h-3" />
                  <span>CONFIRM & PROCEED</span>
                </button>
              </div>
            </div>

            {/* Precision Hairline Progress Bar */}
            <div className="w-full h-1 bg-[rgba(11,15,20,0.1)] overflow-hidden">
              <div
                className="h-full bg-[#225CFF] transition-all duration-150 ease-out"
                style={{ width: `${Math.min(100, Math.round(progress))}%` }}
              />
            </div>
          </div>

          {/* Inline keyframe for laser scan */}
          <style jsx>{`
            @keyframes loaderLaserScan {
              0% {
                top: 5%;
                opacity: 0;
              }
              20% {
                opacity: 1;
              }
              80% {
                opacity: 1;
              }
              100% {
                top: 92%;
                opacity: 0;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
