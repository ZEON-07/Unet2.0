"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InkBubblesProps {
  active: boolean;
  meniscusY: number;
  baseY: number;
  count?: number;
}

export function InkBubbles({
  active,
  meniscusY,
  baseY,
  count = 10,
}: InkBubblesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const [particles, posArray] = useMemo(() => {
    const pseudoRand = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const data = Array.from({ length: count }, (_, idx) => {
      const r1 = pseudoRand(idx * 6 + 1);
      const r2 = pseudoRand(idx * 6 + 2);
      const r3 = pseudoRand(idx * 6 + 3);
      const r4 = pseudoRand(idx * 6 + 4);
      const r5 = pseudoRand(idx * 6 + 5);
      const r6 = pseudoRand(idx * 6 + 6);

      return {
        x: (r1 - 0.5) * 0.16,
        y: baseY + r2 * Math.max(0.1, meniscusY - baseY),
        z: (r3 - 0.5) * 0.16,
        speed: 0.8 + r4 * 1.2,
        size: 0.015 + r5 * 0.02,
        wobbleOffset: r6 * Math.PI * 2,
      };
    });

    const positions = new Float32Array(count * 3);
    data.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    return [data, positions];
  }, [count, baseY, meniscusY]);

  useFrame((state, delta) => {
    if (!pointsRef.current || !active) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    particles.forEach((p, i) => {
      // Rise upwards
      p.y += p.speed * delta;
      // If reached meniscus, respawn near bottom
      if (p.y >= meniscusY) {
        p.y = baseY + 0.05 + Math.random() * 0.1;
        p.x = (Math.random() - 0.5) * 0.16;
        p.z = (Math.random() - 0.5) * 0.16;
      }
      const wobble = Math.sin(state.clock.elapsedTime * 4 + p.wobbleOffset) * 0.01;
      arr[i * 3] = p.x + wobble;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });

    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[posArray, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#BAE6FD"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
