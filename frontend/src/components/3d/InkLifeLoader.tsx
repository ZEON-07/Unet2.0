"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { PenLine, ArrowRight } from "lucide-react";
import { RefillModel } from "./RefillModel";
import { InjectionNozzle } from "./InjectionNozzle";
import { InkStream } from "./InkStream";
import { InkBubbles } from "./InkBubbles";

export interface InkLifeLoaderProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

export function InkLifeLoader({ onComplete }: InkLifeLoaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [statusText, setStatusText] = useState("Preparing your refill…");
  const [percentIndicator, setPercentIndicator] = useState(0);
  const [inkLevel, setInkLevel] = useState(2); // starts almost empty (residual trace)
  const [nozzleProgress, setNozzleProgress] = useState(0); // 0 = left, 1 = docked
  const [isDispensing, setIsDispensing] = useState(false);
  const [refillRotation, setRefillRotation] = useState<[number, number, number]>([0, 0, 0]);

  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;

      // Phase 1: Calibrating & Nozzle entry (0 - 800ms)
      if (elapsed < 800) {
        const p = elapsed / 800;
        const easeP = Math.min(1, p * 1.15);
        setNozzleProgress(easeP);
        setInkLevel(2);
        setIsDispensing(false);
        setStatusText("Calibrating transparent refill…");
        setPercentIndicator(Math.round(p * 35));
        setRefillRotation([0, 0, 0]);
      }
      // Phase 2: Injecting Blue Ink (800ms - 2400ms)
      else if (elapsed < 2400) {
        const p = (elapsed - 800) / 1600;
        const currentInk = Math.round(2 + p * 63); // Rises from 2% to 65%
        setNozzleProgress(1.0);
        setInkLevel(currentInk);
        setIsDispensing(true);
        setStatusText("Injecting blue ink…");
        setPercentIndicator(Math.round(35 + p * 30));
        setRefillRotation([0, 0, 0]);
      }
      // Phase 3: Detecting & Nozzle Retraction (2400ms - 3100ms)
      else if (elapsed < 3100) {
        const p = (elapsed - 2400) / 700;
        setNozzleProgress(Math.max(0, 1.0 - p)); // Retracts left
        setInkLevel(65);
        setIsDispensing(false);
        setStatusText("Ink level detected: 65%");
        setPercentIndicator(Math.round(65 + p * 35));
        setRefillRotation([0, 0, 0]);
      }
      // Phase 4: Diagonal Rotation & Hero Transition (3100ms - 3600ms)
      else if (elapsed < 3600) {
        const p = (elapsed - 3100) / 500;
        setNozzleProgress(0);
        setInkLevel(65);
        setIsDispensing(false);
        setStatusText("Ready");
        setPercentIndicator(100);
        // Rotate smoothly toward hero diagonal angle [0.22, 0.38, 0.10]
        setRefillRotation([p * 0.22, p * 0.38, p * 0.10]);
      }
      // Finished
      else {
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
  }, [onComplete]);

  const handleSkip = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsVisible(false);
    onComplete();
  };

  // Meniscus Y coordinate calculation in local space
  const localBaseY = -1.0;
  const localTravelHeight = 2.7;
  const localInkHeight = Math.max(0.04, (inkLevel / 100) * localTravelHeight);
  const localInkTopY = localBaseY + localInkHeight;

  // Refill group transformation
  const refillScale = 0.92;
  const refillOffsetY = -0.28;

  // World coordinates for nozzle docking and ink stream
  const refillTopOpeningWorldY = 2.20 * refillScale + refillOffsetY; // ~1.744
  const nozzleBaseY = refillTopOpeningWorldY + 0.09; // ~1.834
  const worldMeniscusY = localInkTopY * refillScale + refillOffsetY;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="inklife-cinematic-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#0D1B2A] text-white p-6 sm:p-10 select-none overflow-hidden pointer-events-auto"
        >
          {/* ── Top Bar: Brand Logo & Skip Button ── */}
          <div className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-ink-blue to-ink-mint shadow-lg">
                <PenLine className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-widest uppercase text-white/90">
                Ink<span className="text-ink-mint">Life</span>
              </span>
            </div>

            {/* Skip Intro Button */}
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Skip intro
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── Center: Dedicated 3D Canvas with Empty Refill & Robotic Nozzle ── */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {/* Technical HUD Framing */}
            <div className="absolute w-80 h-[510px] rounded-3xl border border-white/10 pointer-events-none flex items-center justify-center shadow-2xl bg-white/[0.01] backdrop-blur-[1px]">
              <div className="absolute top-4 left-4 text-[9px] uppercase font-mono tracking-widest text-white/35">
                [REFILL_CARTRIDGE_01]
              </div>
              <div className="absolute top-4 right-4 text-[9px] uppercase font-mono tracking-widest text-ink-mint/70">
                CALIBRATING
              </div>
              <div className="absolute bottom-4 left-4 text-[9px] uppercase font-mono tracking-widest text-white/30">
                CAPACITY: 1.0 ML
              </div>
              <div className="absolute bottom-4 right-4 text-[9px] uppercase font-mono tracking-widest text-ink-mint/70">
                TARGET: 65%
              </div>
            </div>

            {/* R3F 3D Scene */}
            <div className="w-full h-full">
              <Canvas
                camera={{ position: [0, 0.25, 6.2], fov: 42 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                style={{ width: "100%", height: "100%", background: "transparent" }}
              >
                <ambientLight intensity={0.95} />
                <hemisphereLight args={["#ffffff", "#0D1B2A", 0.75]} />
                <directionalLight position={[5, 7, 5]} intensity={1.4} color="#ffffff" />
                <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#7DE2D1" />
                <pointLight position={[0, 3, 3]} intensity={1.2} color="#2563EB" />
                <pointLight position={[-3, -1, 2]} intensity={0.6} color="#F59E0B" />

                {/* Robotic Mechanical Injection Nozzle entering from left */}
                {nozzleProgress > 0.01 && (
                  <group>
                    <InjectionNozzle
                      progress={nozzleProgress}
                      dispensing={isDispensing}
                      baseY={nozzleBaseY}
                      color="#2563EB"
                    />

                    {/* Royal-Blue Ink Stream pouring from nozzle into refill opening */}
                    <InkStream
                      active={isDispensing}
                      startY={refillTopOpeningWorldY}
                      endY={worldMeniscusY}
                      color="#2563EB"
                    />
                  </group>
                )}

                {/* Vertical Transparent Pen Refill in Screen Center */}
                <group position={[0, refillOffsetY, 0]} rotation={refillRotation} scale={refillScale}>
                  <RefillModel
                    inkPercentage={inkLevel}
                    highlightMeniscus={isDispensing}
                    interactiveSlider={false}
                    showSliderTooltip={false}
                    colorOverride="#2563EB"
                  />

                  {/* Micro Bubbles rising through ink during active injection */}
                  <InkBubbles
                    active={isDispensing}
                    baseY={localBaseY}
                    meniscusY={localInkTopY}
                    count={14}
                  />
                </group>
              </Canvas>
            </div>
          </div>

          {/* ── Bottom Bar: Status Text & Calibrated Percentage Progress ── */}
          <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center pb-2">
            {/* Fine progress track (0% -> 35% -> 65% -> 100%) */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-ink-blue via-ink-blue-light to-ink-mint transition-all duration-100 ease-out shadow-sm"
                style={{ width: `${percentIndicator}%` }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-xs font-mono text-white/50 mb-1.5">
              <span className="text-white/90 font-sans text-xs tracking-wide font-medium">
                {statusText}
              </span>
              <span className="text-ink-mint font-semibold text-xs font-mono">
                {percentIndicator}%
              </span>
            </div>

            <p className="text-[10px] text-white/35 tracking-widest uppercase font-mono">
              {isDispensing
                ? "INJECTING ROYAL-BLUE INK STREAM"
                : nozzleProgress > 0
                  ? "ALIGNING PRECISION DISPENSER"
                  : "PREPARING REFILL CHAMBER"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
