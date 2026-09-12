"use client";

import React, { Suspense, useRef, useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlenderRefill } from "./BlenderRefill";
import { RefillFallback } from "./RefillFallback";

export interface RefillCanvasProps {
  inkPercentage: number;
  onInkChange?: (percentage: number) => void;
  interactive?: boolean;
  mode?: "hero" | "calculator" | "loader";
  scrollProgress?: number;
  isDarkAnalysisMode?: boolean;
  className?: string;
}

// Error Boundary for Three.js / WebGL / GLB load failure
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[RefillCanvas] 3D Canvas error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Scene inner component handling subtle cursor tilt & scroll transitions
function InteractiveRig({
  children,
  mode,
  interactive,
}: {
  children: React.ReactNode;
  mode: "hero" | "calculator" | "loader";
  interactive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive || mode === "calculator") return;

    // Check if device is mobile or prefers reduced motion
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Subtle tilt mapped from window coordinates
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotRef.current = {
        x: normY * 0.12,
        y: normX * 0.22,
      };
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [interactive, mode]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (mode === "hero") {
      // Natural slight 3D product angle with interactive pointer tilt
      const targetX = 0.08 + targetRotRef.current.x;
      const targetY = 0.22 + targetRotRef.current.y;
      const targetZ = -0.04;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetX,
        4,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetY,
        4,
        delta
      );
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z,
        targetZ,
        4,
        delta
      );
    } else {
      // Keep strictly vertical in calculator and loader modes
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 8, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 8, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 8, delta);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export function RefillCanvas({
  inkPercentage,
  onInkChange,
  interactive = true,
  mode = "hero",
  isDarkAnalysisMode = false,
  className = "w-full h-full",
}: RefillCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <RefillFallback
        inkPercentage={inkPercentage}
        onInkChange={onInkChange}
        interactive={interactive}
        isDarkAnalysisMode={isDarkAnalysisMode}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <ThreeErrorBoundary
        fallback={
          <RefillFallback
            inkPercentage={inkPercentage}
            onInkChange={onInkChange}
            interactive={interactive}
            isDarkAnalysisMode={isDarkAnalysisMode}
          />
        }
      >
        <Canvas
          camera={{
            position: [0, 0, 4.0],
            fov: 36,
          }}
          dpr={[1, 1.5]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              console.warn("[RefillCanvas] WebGL context lost, restoring...");
              setTimeout(() => gl.forceContextRestore(), 150);
            });
          }}
          className="cursor-ns-resize"
        >
          {/* Studio Lighting Rig — Balanced for high-contrast ink visibility */}
          <ambientLight intensity={isDarkAnalysisMode ? 0.4 : 0.65} />
          <hemisphereLight
            args={[
              isDarkAnalysisMode ? "#4D78FF" : "#F8FAFC",
              isDarkAnalysisMode ? "#0B0F14" : "#E2E8F0",
              isDarkAnalysisMode ? 0.5 : 0.5,
            ]}
          />
          
          {/* Key Light */}
          <directionalLight
            position={[3, 6, 4]}
            intensity={isDarkAnalysisMode ? 0.6 : 0.9}
            castShadow={false}
          />
          
          {/* Fill Light */}
          <directionalLight
            position={[-3, 2, 3]}
            intensity={isDarkAnalysisMode ? 0.3 : 0.45}
            color={isDarkAnalysisMode ? "#62DDD1" : "#F8FAFC"}
          />

          {/* Electric Blue Rim Light */}
          <pointLight
            position={[-2.5, -2, -2]}
            color={isDarkAnalysisMode ? "#4D78FF" : "#0055FF"}
            intensity={isDarkAnalysisMode ? 1.5 : 1.2}
          />

          {/* Back Specular Light */}
          <directionalLight
            position={[0, 4, -4]}
            intensity={0.4}
            color="#FFFFFF"
          />

          {/* Suspense Loading */}
          <Suspense fallback={null}>
            <InteractiveRig mode={mode} interactive={interactive}>
              <BlenderRefill
                inkPercentage={inkPercentage}
                onInkChange={onInkChange}
                interactive={interactive}
                isDarkAnalysisMode={isDarkAnalysisMode}
              />
            </InteractiveRig>
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
}
