"use client";

import { Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { RefillModel } from "./RefillModel";
import { InjectionNozzle } from "./InjectionNozzle";
import { InkStream } from "./InkStream";
import { InkBubbles } from "./InkBubbles";
import { HeroRefillController } from "./HeroRefillController";
import { WebGLFallback } from "./WebGLFallback";

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

// ─── Floating Accent Orbs ───────────────────────────────────────────────────
function AccentOrb({
  position,
  color,
  size,
  opacity = 0.5,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.2}
        metalness={0.1}
        transmission={0.4}
        transparent
        opacity={opacity}
        clearcoat={0.8}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
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
  showOrbs?: boolean;
}

export function RefillScene({
  mode,
  inkPercentage,
  onInkChange,
  nozzleProgress = 0,
  isDispensing = false,
  introTransitionProgress = 1,
  scrollProgress = 0,
  showOrbs = true,
}: RefillSceneProps) {
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
        <ambientLight intensity={mode === "intro" ? 0.9 : 0.8} />
        <hemisphereLight
          args={[
            "#ffffff",
            mode === "intro" ? "#0D1B2A" : "#1B2A4A",
            mode === "intro" ? 0.8 : 0.6,
          ]}
        />
        <directionalLight position={[5, 7, 5]} intensity={1.3} color="#ffffff" />
        <directionalLight
          position={[-4, -2, -3]}
          intensity={0.6}
          color="#7DE2D1"
        />
        <pointLight position={[0, 3, 3]} intensity={1.0} color="#2563EB" />
        <pointLight position={[-3, -1, 2]} intensity={0.5} color="#F59E0B" />

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
              color="#2563EB"
            />
          </group>
        )}

        {/* ── Refill Model + Controller ── */}
        <HeroRefillController
          mode={mode}
          introTransitionProgress={introTransitionProgress}
          scrollProgress={scrollProgress}
        >
          <RefillModel
            inkPercentage={inkPercentage}
            interactiveSlider={mode === "hero"}
            onInkChange={onInkChange}
            highlightMeniscus={isDispensing}
          />

          {/* Micro Bubbles inside the liquid during active ink injection */}
          <InkBubbles
            active={isDispensing}
            baseY={baseY}
            meniscusY={inkTopY}
            count={12}
          />
        </HeroRefillController>

        {/* ── Ambient Orbs (Faded in for hero mode) ── */}
        {showOrbs && introTransitionProgress > 0.3 && (
          <group>
            <AccentOrb
              position={[-3.0, 1.4, -2.0]}
              color="#2563EB"
              size={0.38}
              opacity={0.45 * introTransitionProgress}
            />
            <AccentOrb
              position={[3.2, -0.9, -2.5]}
              color="#7DE2D1"
              size={0.48}
              opacity={0.5 * introTransitionProgress}
            />
            <AccentOrb
              position={[-2.4, -1.8, -1.2]}
              color="#F59E0B"
              size={0.28}
              opacity={0.4 * introTransitionProgress}
            />
            <AccentOrb
              position={[2.4, 2.0, -2.2]}
              color="#2563EB"
              size={0.32}
              opacity={0.45 * introTransitionProgress}
            />
          </group>
        )}
      </Canvas>
    </SceneErrorBoundary>
  );
}
