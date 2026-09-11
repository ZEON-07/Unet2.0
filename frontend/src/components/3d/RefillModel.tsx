"use client";

import { useRef, useMemo } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

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
  highlightMeniscus = false,
  showSliderTooltip = true,
  colorOverride,
  isDarkAnalysisMode = false,
}: RefillModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clamp = Math.max(0, Math.min(100, inkPercentage));

  // Dynamic ink fluid color based on remaining volume and active mode
  const inkColor = useMemo(() => {
    if (colorOverride) return colorOverride;
    if (isDarkAnalysisMode) {
      return "#4D78FF"; // Radiant electric cyan-blue in dark UV analysis mode
    }
    if (clamp > 60) return "#225CFF"; // Deep electric blue
    if (clamp > 30) return "#0284C7"; // Laboratory cobalt
    if (clamp > 10) return "#EA580C"; // Warning amber
    return "#DC2626"; // Critical low ink
  }, [clamp, colorOverride, isDarkAnalysisMode]);

  // Geometry dimensions
  // Tube spans from baseY = -1.0 up to 2.0 (total tube length = 3.0)
  const baseY = -1.0;
  const travelHeight = 2.7;
  const inkHeight = Math.max(0.04, (clamp / 100) * travelHeight);
  const inkTopY = baseY + inkHeight;
  const inkCenterY = baseY + inkHeight / 2;

  // Viscous silicone follower gel plug above the ink
  const followerHeight = 0.32;
  const followerCenterY = inkTopY + followerHeight / 2;

  // Direct click & drag handler on the 3D refill
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!interactiveSlider || !onInkChange) return;
    e.stopPropagation();

    // 1. Direct jump based on where clicked on the tube
    if (groupRef.current) {
      const local = groupRef.current.worldToLocal(e.point.clone());
      const pct = Math.round(((local.y - baseY) / travelHeight) * 100);
      onInkChange(Math.max(0, Math.min(100, pct)));
    }

    // 2. Smooth continuous drag tracking
    const startY = e.clientY;
    const startPct = clamp;

    const onPointerMove = (ev: PointerEvent) => {
      const deltaY = startY - ev.clientY;
      const sensitivity = 0.5;
      const nextPct = Math.max(
        0,
        Math.min(100, Math.round(startPct + deltaY * sensitivity))
      );
      onInkChange(nextPct);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const ticks = [0, 25, 50, 75, 100];

  return (
    <group ref={groupRef} scale={scale}>
      {/* ── 1. Refill_Barrel (Named transparent outer cylinder) ── */}
      <mesh name="Refill_Barrel" position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 3.0, 32]} />
        <meshPhysicalMaterial
          color={isDarkAnalysisMode ? "#0F172A" : "#F8FAFC"}
          transmission={isDarkAnalysisMode ? 0.82 : 0.94}
          roughness={isDarkAnalysisMode ? 0.12 : 0.05}
          thickness={0.25}
          transparent
          opacity={isDarkAnalysisMode ? 0.45 : 0.65}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          reflectivity={0.65}
          ior={1.46}
          emissive={isDarkAnalysisMode ? "#2563EB" : "#000000"}
          emissiveIntensity={isDarkAnalysisMode ? 0.18 : 0}
        />
      </mesh>

      {/* Blueprint wireframe cage in dark analysis mode */}
      {isDarkAnalysisMode && (
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.166, 0.166, 3.01, 16, 8, true]} />
          <meshBasicMaterial
            wireframe
            color="#4D78FF"
            transparent
            opacity={0.22}
          />
        </mesh>
      )}

      {/* ── Etched calibration gauge rings on tube ── */}
      {ticks.map((t) => {
        const tickY = baseY + (t / 100) * travelHeight;
        return (
          <group key={t} position={[0, tickY, 0]}>
            <mesh>
              <torusGeometry args={[0.166, 0.0035, 12, 48]} />
              <meshStandardMaterial
                color={
                  isDarkAnalysisMode
                    ? "#62DDD1"
                    : t === 0 || t === 100
                    ? "#0B0F14"
                    : "#64748B"
                }
                roughness={0.4}
                metalness={0.6}
                emissive={isDarkAnalysisMode ? "#62DDD1" : "#000000"}
                emissiveIntensity={isDarkAnalysisMode ? 0.4 : 0}
              />
            </mesh>
            <mesh position={[-0.18, 0, 0]}>
              <boxGeometry args={[0.035, 0.012, 0.012]} />
              <meshStandardMaterial
                color={isDarkAnalysisMode ? "#62DDD1" : "#0B0F14"}
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      })}

      {/* ── 2. Ink_Liquid (Named fluid column inside refill) ── */}
      <mesh name="Ink_Liquid" position={[0, inkCenterY, 0]}>
        <cylinderGeometry args={[0.145, 0.145, inkHeight, 32]} />
        <meshPhysicalMaterial
          color={inkColor}
          roughness={0.12}
          metalness={0.04}
          transmission={isDarkAnalysisMode ? 0.1 : 0.18}
          transparent
          opacity={0.95}
          emissive={inkColor}
          emissiveIntensity={
            isDarkAnalysisMode
              ? 0.85
              : highlightMeniscus
              ? 0.45
              : 0.22
          }
          clearcoat={0.6}
        />
      </mesh>

      {/* ── 3. Ink_Meniscus (Named curved liquid surface disc) ── */}
      <mesh name="Ink_Meniscus" position={[0, inkTopY, 0]}>
        <cylinderGeometry args={[0.145, 0.145, 0.018, 32]} />
        <meshStandardMaterial
          color={inkColor}
          roughness={0.05}
          emissive={inkColor}
          emissiveIntensity={
            isDarkAnalysisMode ? 0.95 : highlightMeniscus ? 0.8 : 0.4
          }
        />
      </mesh>

      {/* ── Follower Gel (Silicone grease plug above ink) ── */}
      {followerCenterY < 1.95 && (
        <mesh position={[0, followerCenterY, 0]}>
          <cylinderGeometry args={[0.144, 0.144, followerHeight, 32]} />
          <meshPhysicalMaterial
            color={isDarkAnalysisMode ? "#62DDD1" : "#FEF3C7"}
            roughness={0.18}
            metalness={0.02}
            transmission={0.85}
            thickness={0.4}
            transparent
            opacity={isDarkAnalysisMode ? 0.35 : 0.6}
            clearcoat={0.7}
            emissive={isDarkAnalysisMode ? "#62DDD1" : "#000000"}
            emissiveIntensity={isDarkAnalysisMode ? 0.25 : 0}
          />
        </mesh>
      )}

      {/* ── 4. Rear_Plug (Named rear end stopper at top opening) ── */}
      <group name="Rear_Plug" position={[0, 2.0, 0]}>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.142, 0.142, 0.2, 32]} />
          <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 32]} />
          <meshStandardMaterial color={inkColor} roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 32]} />
          <meshStandardMaterial color="#0F172A" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.06, 0.015, 16, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* ── 5. Metal_Tip (Named front stainless steel + rollerball tip) ── */}
      <group name="Metal_Tip" position={[0, 0, 0]}>
        <mesh position={[0, -1.08, 0]}>
          <cylinderGeometry args={[0.168, 0.158, 0.18, 32]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.92} />
        </mesh>
        <mesh position={[0, -1.18, 0]}>
          <cylinderGeometry args={[0.172, 0.172, 0.05, 32]} />
          <meshStandardMaterial color="#D4AF37" roughness={0.25} metalness={0.9} />
        </mesh>
        <mesh position={[0, -1.38, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.38, 32]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.15} metalness={0.95} />
        </mesh>
        <mesh position={[0, -1.66, 0]}>
          <coneGeometry args={[0.072, 0.3, 32]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.92} />
        </mesh>
        <mesh position={[0, -1.82, 0]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial
            color={inkColor}
            roughness={0.1}
            emissive={inkColor}
            emissiveIntensity={isDarkAnalysisMode ? 0.9 : 0.6}
          />
        </mesh>
        {clamp < 20 && clamp > 0 && (
          <mesh position={[0, -1.89, 0]}>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial
              color={inkColor}
              transparent
              opacity={0.88}
              emissive={inkColor}
              emissiveIntensity={isDarkAnalysisMode ? 0.8 : 0.5}
            />
          </mesh>
        )}
      </group>

      {/* ── Optional Interactive Slider Collar on Meniscus ── */}
      {interactiveSlider && (
        <group position={[0, inkTopY, 0]}>
          <mesh>
            <cylinderGeometry args={[0.218, 0.218, 0.07, 32]} />
            <meshStandardMaterial
              color={isDarkAnalysisMode ? "#4D78FF" : "#F8FAFC"}
              roughness={0.15}
              metalness={0.95}
              emissive={isDarkAnalysisMode ? "#4D78FF" : "#000000"}
              emissiveIntensity={isDarkAnalysisMode ? 0.3 : 0}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 0.025, 32]} />
            <meshStandardMaterial
              color={inkColor}
              roughness={0.2}
              emissive={inkColor}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Technical Laboratory Readout Tag */}
          {showSliderTooltip && (
            <Html position={[0.42, 0, 0]} center pointerEvents="none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] shadow-md select-none whitespace-nowrap">
                <span className="text-[var(--ink-blue)]">↕</span>
                <span>SAMPLE: {Math.round(clamp)}%</span>
              </div>
            </Html>
          )}
        </group>
      )}

      {/* ── Hit-box cylinder for smooth vertical drag ── */}
      {interactiveSlider && (
        <mesh
          position={[0, 0.45, 0]}
          onPointerDown={handlePointerDown}
          onPointerOver={() => {
            document.body.style.cursor = "ns-resize";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <cylinderGeometry args={[0.45, 0.45, 3.2, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
