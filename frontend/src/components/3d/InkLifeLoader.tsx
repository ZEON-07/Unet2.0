"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefillFallback } from "@/components/three/RefillFallback";

export interface InkLifeLoaderProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

export function InkLifeLoader({ onComplete, forcePlay = false }: InkLifeLoaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [statusText, setStatusText] = useState("INITIALISING INKLIFE");
  const [techPhase, setTechPhase] = useState<string>("SYSTEM BOOT / 01");
  const [percentIndicator, setPercentIndicator] = useState(0);
  const [inkLevel, setInkLevel] = useState(0);
  const [nozzleProgress, setNozzleProgress] = useState(0);
  const [isDispensing, setIsDispensing] = useState(false);
  const [refillRotation, setRefillRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [laserScanY, setLaserScanY] = useState(0);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Check sessionStorage if not forcePlay
    if (!forcePlay) {
      try {
        const seen = sessionStorage.getItem("inklife_intro_seen");
        if (seen === "true") {
          setIsVisible(false);
          onComplete();
          return;
        }
      } catch {
        // Continue if storage fails
      }
    }

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;

      // Phase 1: Wireframe Detection & Scanning (0 - 750ms)
      if (elapsed < 750) {
        const p = elapsed / 750;
        setNozzleProgress(0);
        setInkLevel(0);
        setIsDispensing(false);
        setStatusText("REFILL DETECTED • MATERIAL: TRANSPARENT POLYMER");
        setTechPhase("OPTICAL SCAN / 01");
        setPercentIndicator(Math.round(p * 25));
        setLaserScanY(p * 100);
        setRefillRotation([0, 0, 0]);
      }
      // Phase 2: Docking Nozzle & Channel Locating (750ms - 1300ms)
      else if (elapsed < 1300) {
        const p = (elapsed - 750) / 550;
        setNozzleProgress(Math.min(1, p * 1.1));
        setInkLevel(0);
        setIsDispensing(false);
        setStatusText("INK CHANNEL LOCATED • DOCKING INJECTOR");
        setTechPhase("PRECISION ALIGNMENT / 02");
        setPercentIndicator(Math.round(25 + p * 20));
        setRefillRotation([0, 0, 0]);
      }
      // Phase 3: Injecting Sample Fluid (1300ms - 2700ms)
      else if (elapsed < 2700) {
        const p = (elapsed - 1300) / 1400;
        const currentInk = Math.round(p * 65); // Rises 0% to 65%
        setNozzleProgress(1.0);
        setInkLevel(currentInk);
        setIsDispensing(true);
        setStatusText(`INJECTING SAMPLE • FLOW: ${currentInk}% VOL`);
        setTechPhase("FLUID SAMPLE INJECTION / 03");
        setPercentIndicator(Math.round(45 + p * 40));
        setRefillRotation([0, 0, 0]);
      }
      // Phase 4: Calibration Complete & Retraction (2700ms - 3200ms)
      else if (elapsed < 3200) {
        const p = (elapsed - 2700) / 500;
        setNozzleProgress(Math.max(0, 1.0 - p * 1.2));
        setInkLevel(65);
        setIsDispensing(false);
        setStatusText("CALIBRATION COMPLETE • READY FOR ESTIMATION");
        setTechPhase("BENCHMARK VERIFIED / 04");
        setPercentIndicator(Math.round(85 + p * 15));
        setRefillRotation([p * 0.15, p * 0.28, 0]);
      }
      // Phase 5: Transition into Hero (3200ms - 3500ms)
      else {
        try {
          sessionStorage.setItem("inklife_intro_seen", "true");
        } catch {}
        setIsVisible(false);
        onComplete();
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [onComplete, forcePlay]);

  const handleSkip = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    try {
      sessionStorage.setItem("inklife_intro_seen", "true");
    } catch {}
    setIsVisible(false);
    onComplete();
  };

  const localBaseY = -1.0;
  const localTravelHeight = 2.7;
  const localInkHeight = Math.max(0.04, (inkLevel / 100) * localTravelHeight);
  const localInkTopY = localBaseY + localInkHeight;

  const refillScale = 0.96;
  const refillOffsetY = -0.22;
  const worldMeniscusY = localInkTopY * refillScale + refillOffsetY;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="inklife-swiss-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#F5F4EF] text-[#0B0F14] p-6 sm:p-10 select-none overflow-hidden lab-grid"
        >
          {/* ── Top Header ── */}
          <div className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto border-b border-[rgba(11,15,20,0.15)] pb-4 font-mono text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-extrabold tracking-tighter uppercase text-sm">
                INKLIFE<span className="text-[#225CFF]">®</span>
              </span>
              <span className="text-[rgba(11,15,20,0.4)]">/</span>
              <span className="tracking-widest uppercase text-[rgba(11,15,20,0.6)]">
                CALIBRATION LAB
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-[rgba(11,15,20,0.5)]">
                {techPhase}
              </span>
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-1.5 border border-[#0B0F14] bg-[#FFFFFF] text-[#0B0F14] hover:bg-[#0B0F14] hover:text-[#FFFFFF] transition-all text-[10px] font-bold tracking-wider uppercase cursor-pointer"
              >
                SKIP INTRO →
              </button>
            </div>
          </div>

          {/* ── Center 3D Stage with Technical Measurement Overlays ── */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            {/* Center Stage with Blueprint Refill */}
            <div className="relative z-10 flex items-center justify-center scale-110">
              <RefillFallback
                inkPercentage={inkLevel}
                interactive={false}
                isDarkAnalysisMode={false}
              />
            </div>

            {/* Laser Height Scan Line (Visual element in Phase 1) */}
            {laserScanY > 0 && laserScanY < 100 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-48 h-[1px] bg-[#225CFF] shadow-[0_0_8px_#225CFF] pointer-events-none transition-all duration-75 z-20"
                style={{ top: `${laserScanY}%` }}
              />
            )}

            {/* Technical Annotation Boxes beside Refill */}
            <div className="hidden md:flex absolute inset-0 pointer-events-none items-center justify-between max-w-4xl mx-auto px-6 font-mono text-[10px] text-[rgba(11,15,20,0.6)]">
              {/* Left Side Telemetry */}
              <div className="space-y-4 border-l border-[rgba(11,15,20,0.2)] pl-4">
                <div>
                  <div className="font-bold text-[#0B0F14]">GEOMETRY</div>
                  <div>CYLINDER 3.0 × 0.33M</div>
                </div>
                <div>
                  <div className="font-bold text-[#0B0F14]">POLYMER</div>
                  <div>PP CLR-14 / HIGH TRANSMISSION</div>
                </div>
                <div>
                  <div className="font-bold text-[#0B0F14]">BALLPOINT TIP</div>
                  <div>TUNGSTEN CARBIDE 1.0MM</div>
                </div>
              </div>

              {/* Right Side Telemetry */}
              <div className="space-y-4 border-r border-[rgba(11,15,20,0.2)] pr-4 text-right">
                <div>
                  <div className="font-bold text-[#0B0F14]">SAMPLE VOLUME</div>
                  <div className="text-[#225CFF] font-bold">{inkLevel}% CAPACITY</div>
                </div>
                <div>
                  <div className="font-bold text-[#0B0F14]">VISCOSITY</div>
                  <div>NORMAL BALLPOINT PASTE</div>
                </div>
                <div>
                  <div className="font-bold text-[#0B0F14]">NATIVE FLOW</div>
                  <div>PRE-INCLUDED IN CLAIM</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Technical Telemetry Bar ── */}
          <div className="relative z-20 w-full max-w-7xl mx-auto font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#225CFF] animate-pulse" />
                <span className="font-bold tracking-wider uppercase text-[#0B0F14]">
                  {statusText}
                </span>
              </div>
              <span className="font-bold text-[#225CFF] tracking-widest text-right">
                [{percentIndicator.toString().padStart(3, "0")}%]
              </span>
            </div>

            {/* Precision Hairline Progress Bar */}
            <div className="w-full h-1 bg-[rgba(11,15,20,0.1)] overflow-hidden">
              <div
                className="h-full bg-[#225CFF] transition-all duration-100 ease-out"
                style={{ width: `${percentIndicator}%` }}
              />
            </div>

            {/* Micro grid coordinates */}
            <div className="flex items-center justify-between text-[9px] text-[rgba(11,15,20,0.4)] tracking-widest pt-2">
              <span>LAT 47.3769° N, LON 8.5417° E</span>
              <span>CALIBRATION SEQUENCE 01919-V2</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
