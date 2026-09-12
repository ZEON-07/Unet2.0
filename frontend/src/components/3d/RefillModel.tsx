"use client";

import { useRef, Suspense } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BlenderRefill } from "@/components/three/BlenderRefill";

export interface RefillModelProps {
  inkPercentage: number;
  interactiveSlider?: boolean;
  onInkChange?: (val: number) => void;
  scale?: number;
  highlightMeniscus?: boolean;
  showSliderTooltip?: boolean;
  colorOverride?: string;
  isDarkAnalysisMode?: boolean;
}

export function RefillModel({
  inkPercentage,
  interactiveSlider = false,
  onInkChange,
  scale = 1.0,
  showSliderTooltip = true,
  colorOverride,
  isDarkAnalysisMode = false,
}: RefillModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clamp = Math.max(0, Math.min(100, Math.round(inkPercentage)));

  return (
    <group ref={groupRef} scale={scale}>
      {/* ── Real Blender GLB Refill Model ── */}
      <Suspense fallback={null}>
        <BlenderRefill
          inkPercentage={clamp}
          onInkChange={onInkChange}
          interactive={interactiveSlider}
          isDarkAnalysisMode={isDarkAnalysisMode}
          colorOverride={colorOverride}
        />
      </Suspense>

      {/* ── Interactive HTML HUD Tooltip for Vertical Dragging ── */}
      {interactiveSlider && showSliderTooltip && (
        <Html
          position={[0.35, 0.4, 0]}
          center
          distanceFactor={6}
          className="pointer-events-none select-none font-mono"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-[10px] shadow-sm tracking-wider uppercase whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-blue)] animate-ping" />
            <span>
              DRAG REFILL: <strong className="text-[var(--ink-blue)]">{clamp}% INK</strong>
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
