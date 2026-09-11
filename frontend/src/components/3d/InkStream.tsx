"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InkStreamProps {
  active: boolean;
  startY: number;
  endY: number;
  x?: number;
  z?: number;
  color?: string;
}

export function InkStream({
  active,
  startY,
  endY,
  x = 0,
  z = 0,
  color = "#2563EB",
}: InkStreamProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const length = Math.max(0.01, startY - endY);
  const centerY = startY - length / 2;

  useFrame((state) => {
    if (!meshRef.current || !active) return;
    // Pulsating flow effect
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 25) * 0.15;
    meshRef.current.scale.set(pulse, 1, pulse);
  });

  if (!active || length <= 0.02) return null;

  return (
    <mesh ref={meshRef} position={[x, centerY, z]}>
      <cylinderGeometry args={[0.022, 0.028, length, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.85}
        roughness={0.1}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}
