"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface InkControllerProps {
  inkPercentage: number;
  inkMesh: THREE.Mesh | null;
  anchorWorldY: number;
  anchorGeomY: number;
  initialScaleY?: number;
  fillAxis?: "x" | "y" | "z";
  isDarkAnalysisMode?: boolean;
  colorOverride?: string;
}

export function InkController({
  inkPercentage,
  inkMesh,
  anchorWorldY,
  anchorGeomY,
  initialScaleY = 1.0,
  fillAxis = "y",
  isDarkAnalysisMode: _isDarkAnalysisMode = false,
  colorOverride,
}: InkControllerProps) {
  // Current smoothly damped scale factor
  const currentScaleRef = useRef<number>(Math.max(0.015, inkPercentage / 100));

  // Target ink fill percentage clamped between 1.5% and 100%
  const normalizedInk = THREE.MathUtils.clamp(inkPercentage / 100, 0, 1);
  const targetFill = Math.max(0.015, normalizedInk);

  // Frame update loop with delta timing
  useFrame((_, delta) => {
    if (!inkMesh) return;

    // Smooth mechanical interpolation (damp factor = 8)
    currentScaleRef.current = THREE.MathUtils.damp(
      currentScaleRef.current,
      targetFill,
      8,
      delta
    );

    const s = currentScaleRef.current;

    // 1. Scale along detected vertical fill axis without cumulative multiplication
    inkMesh.scale[fillAxis] = s * initialScaleY;

    // 2. Compensating position offset to keep bottom strictly anchored against tip
    inkMesh.position[fillAxis] = anchorWorldY - s * anchorGeomY;

    // 3. Optional color override only if explicitly requested
    if (colorOverride && inkMesh.material) {
      const mat = (
        Array.isArray(inkMesh.material) ? inkMesh.material[0] : inkMesh.material
      ) as THREE.MeshStandardMaterial;
      if (mat && mat.color) {
        mat.color.set(colorOverride);
      }
    }
  });

  return null;
}
