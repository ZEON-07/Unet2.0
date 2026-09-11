"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InjectionNozzleProps {
  progress: number; // 0 = fully retracted, 1 = fully aligned over refill opening
  dispensing: boolean;
  color?: string;
  baseY?: number;
}

export function InjectionNozzle({
  progress,
  dispensing,
  color = "#2563EB",
  baseY = 2.28,
}: InjectionNozzleProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Animate X from -3.2 (off-screen left) to 0.0 (aligned over refill opening)
  const currentX = THREE.MathUtils.lerp(-3.2, 0, progress);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = currentX;
    // Micro mechanical vibration when dispensing
    if (dispensing) {
      groupRef.current.position.y =
        baseY + Math.sin(state.clock.elapsedTime * 40) * 0.005;
    } else {
      groupRef.current.position.y = baseY;
    }
  });

  return (
    <group ref={groupRef} position={[currentX, baseY, 0]}>
      {/* ── Main horizontal robotic feeder rail ── */}
      <mesh position={[-1.2, 0.45, 0]}>
        <boxGeometry args={[2.4, 0.12, 0.14]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Chrome slider carriage block */}
      <mesh position={[-0.2, 0.45, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.2]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Hydraulic piston cylinder */}
      <mesh position={[-0.5, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 24]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.1} metalness={0.98} />
      </mesh>

      {/* ── Downward dispenser block ── */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 32]} />
        <meshStandardMaterial color="#0F172A" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Luminous dispensing status ring */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.03, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dispensing ? 1.5 : 0.2}
          roughness={0.2}
        />
      </mesh>

      {/* Clear fluid viewing chamber in nozzle */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.14, 24]} />
        <meshPhysicalMaterial
          color={dispensing ? color : "#E2E8F0"}
          roughness={0.1}
          transmission={0.6}
          transparent
          opacity={0.85}
          emissive={dispensing ? color : "#000000"}
          emissiveIntensity={dispensing ? 0.4 : 0}
        />
      </mesh>

      {/* Precision stainless steel needle nozzle tip */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.035, 0.025, 0.18, 24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.1} metalness={0.98} />
      </mesh>

      {/* Ultrafine dispenser aperture positioned just above refill plug */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.08, 16]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
}
