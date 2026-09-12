"use client";

import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { RefillModel } from "./RefillModel";
import { InjectionNozzle } from "./InjectionNozzle";
import { InkStream } from "./InkStream";
import { InkBubbles } from "./InkBubbles";
import { HeroRefillController } from "./HeroRefillController";
import { WebGLFallback } from "./WebGLFallback";
import { useInkMode } from "@/components/providers/InkModeProvider";

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackInkPercentage?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class SceneErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D Refill Scene error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <WebGLFallback
          inkPercentage={this.props.fallbackInkPercentage ?? 65}
        />
      );
    }
    return this.props.children;
  }
}

// ─── Main Refill Scene Props ─────────────────────────────────────────────────
export interface RefillSceneProps {
  mode: "intro" | "hero";
  inkPercentage: number;
  onInkChange?: (val: number) => void;
  nozzleProgress?: number; // 0 = retracted, 1 = docked
  isDispensing?: boolean;
  introTransitionProgress?: number; // 0 (intro) -> 1 (hero)
  scrollProgress?: number;
  isScanning?: boolean;
  isDarkAnalysisMode?: boolean;
}

export function RefillScene({
  mode,
  inkPercentage,
  onInkChange,
  nozzleProgress = 0,
  isDispensing = false,
  introTransitionProgress = 1,
  scrollProgress = 0,
  isScanning = false,
  isDarkAnalysisMode: customDark,
}: RefillSceneProps) {
  const { mode: contextMode } = useInkMode();
  const isDark = customDark !== undefined ? customDark : contextMode === "dark";

  // Compute fluid meniscus Y in local space
  const clamp = Math.max(0, Math.min(100, inkPercentage));
  const baseY = -1.0;
  const travelHeight = 2.7;
  const inkHeight = Math.max(0.04, (clamp / 100) * travelHeight);
  const inkTopY = baseY + inkHeight;

  return (
    <SceneErrorBoundary fallbackInkPercentage={inkPercentage}>
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        {/* Laboratory Lighting adjusted for Light Paper vs Dark UV mode */}
        <ambientLight intensity={isDark ? 0.35 : mode === "intro" ? 0.95 : 0.9} />
        <hemisphereLight
          args={[
            isDark ? "#4D78FF" : "#ffffff",
            isDark ? "#050706" : "#E2E8F0",
            isDark ? 0.6 : 0.7,
          ]}
        />
        <directionalLight
          position={[5, 7, 5]}
          intensity={isDark ? 0.8 : 1.4}
          color="#ffffff"
        />
        <directionalLight
          position={[-4, -2, -3]}
          intensity={isDark ? 0.9 : 0.5}
          color={isDark ? "#62DDD1" : "#94A3B8"}
        />

        {/* Ultraviolet rim lighting in dark analysis mode */}
        {isDark && (
          <>
            <pointLight position={[0, 2, 3]} intensity={1.8} color="#4D78FF" distance={8} />
            <pointLight position={[0, -2, 2]} intensity={1.2} color="#62DDD1" distance={6} />
          </>
        )}

        {/* ── Mechanical Injection Nozzle (During Intro) ── */}
        {mode === "intro" && nozzleProgress > 0.01 && (
          <group>
            <InjectionNozzle
              progress={nozzleProgress}
              dispensing={isDispensing}
            />

            {/* Ink Stream from nozzle tip into refill cartridge opening */}
            <InkStream
              active={isDispensing}
              startY={2.19}
              endY={inkTopY}
              color={isDark ? "#4D78FF" : "#225CFF"}
            />
          </group>
        )}

        {/* ── Refill Model + Controller ── */}
        <Suspense fallback={null}>
          <HeroRefillController
            mode={mode}
            introTransitionProgress={introTransitionProgress}
            scrollProgress={scrollProgress}
          >
            <RefillModel
              inkPercentage={inkPercentage}
              interactiveSlider={mode === "hero"}
              onInkChange={onInkChange}
              highlightMeniscus={isDispensing || isScanning}
              isDarkAnalysisMode={isDark}
            />

            {/* Micro Bubbles inside the liquid during active ink injection */}
            <InkBubbles
              active={isDispensing}
              baseY={baseY}
              meniscusY={inkTopY}
              count={14}
            />
          </HeroRefillController>
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
