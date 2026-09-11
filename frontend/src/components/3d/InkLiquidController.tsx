"use client";

import { useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Controller to smoothly interpolate ink percentage values for fluid animation
 */
export function useInkLiquidSmooth(
  targetLevel: number,
  speed: number = 0.1
): number {
  const [level, setLevel] = useState(targetLevel);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setLevel((prev) => {
        const next = THREE.MathUtils.lerp(prev, targetLevel, speed);
        if (Math.abs(next - targetLevel) > 0.05) {
          animId = requestAnimationFrame(animate);
        }
        return next;
      });
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetLevel, speed]);

  return level;
}

export function InkLiquidController({
  inkLevel,
  children,
}: {
  inkLevel: number;
  children: (smoothInk: number) => React.ReactNode;
}) {
  return <>{children(inkLevel)}</>;
}
