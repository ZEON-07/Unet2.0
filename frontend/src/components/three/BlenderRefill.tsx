"use client";

import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { InkController } from "./InkController";

export interface BlenderRefillProps {
  inkPercentage: number;
  onInkChange?: (percentage: number) => void;
  interactive?: boolean;
  isDarkAnalysisMode?: boolean;
  colorOverride?: string;
}

/**
 * Safely searches an Object3D hierarchy for the first object matching any of the candidate names.
 */
function findFirstObject(scene: THREE.Object3D, names: string[]): THREE.Object3D | null {
  for (const name of names) {
    const object = scene.getObjectByName(name);
    if (object) {
      return object;
    }
  }
  // Also check case-insensitive match
  let found: THREE.Object3D | null = null;
  scene.traverse((child) => {
    if (found) return;
    for (const name of names) {
      if (child.name.toLowerCase() === name.toLowerCase()) {
        found = child;
        return;
      }
    }
  });
  return found;
}

// Pristine geometric calibration constants for public/models/pen-refill.glb
// Derived from the author's Blender model coordinates to prevent runtime state corruption
const PRISTINE_CALIBRATION = {
  centerY: 39.1809,
  totalHeight: 78.061,
  initialScaleY: 10.80479,
  anchorWorldY: 74.0625,
  anchorGeomY: 6.24946,
};

export function BlenderRefill({
  inkPercentage,
  onInkChange,
  interactive = true,
  isDarkAnalysisMode = false,
  colorOverride,
}: BlenderRefillProps) {
  // Load the Blender GLB model from the requested asset path
  const gltf = useGLTF("/models/pen-refill.glb");

  // Clone scene so multiple instances never mutate original cache
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // Main container reference
  const containerRef = useRef<THREE.Group>(null);

  // One-time mesh discovery and transparency setup on pristine cloned model
  const calibration = useMemo(() => {
    const barrel = findFirstObject(model, ["Refill_Barrel", "Cylinder"]) as THREE.Mesh | null;
    const inkLiquid = findFirstObject(model, ["Ink_Liquid", "Cylinder.002"]) as THREE.Mesh | null;
    const metalTip = findFirstObject(model, ["Metal_Tip", "Cylinder.001"]) as THREE.Mesh | null;
    const rearPlug = findFirstObject(model, ["Rear_Plug", "Cylinder.003"]) as THREE.Mesh | null;

    // Apply WebGL transparency order without altering author's model geometry
    if (barrel) {
      barrel.renderOrder = 2; // Render outer transparent barrel after liquid to prevent occlusion
      const mat = (Array.isArray(barrel.material) ? barrel.material[0] : barrel.material) as THREE.MeshStandardMaterial;
      if (mat) {
        mat.transparent = true;
        mat.opacity = 0.15; // Crystal-clear transparent outer barrel so ink is 100% visible
        mat.depthWrite = false; // Prevent glass barrel from writing to depth buffer
        mat.roughness = 0.05;
        mat.metalness = 0.0;
        mat.color = new THREE.Color("#F8FAFC");
      }
    }

    if (inkLiquid) {
      inkLiquid.renderOrder = 1;
      const mat = (Array.isArray(inkLiquid.material) ? inkLiquid.material[0] : inkLiquid.material) as THREE.MeshStandardMaterial;
      if (mat) {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.roughness = 0.1;
        mat.metalness = 0.02;
        mat.depthWrite = true;
        const inkBlue = colorOverride || (isDarkAnalysisMode ? "#2B6CB0" : "#0047E1");
        const emissiveBlue = colorOverride || (isDarkAnalysisMode ? "#1E40AF" : "#002EA8");
        mat.color = new THREE.Color(inkBlue);
        mat.emissive = new THREE.Color(emissiveBlue);
        mat.emissiveIntensity = isDarkAnalysisMode ? 0.45 : 0.35;
      }
    }

    if (metalTip) {
      metalTip.renderOrder = 3;
    }

    if (rearPlug) {
      rearPlug.renderOrder = 3;
    }

    return {
      inkMesh: inkLiquid,
      anchorWorldY: PRISTINE_CALIBRATION.anchorWorldY,
      anchorGeomY: PRISTINE_CALIBRATION.anchorGeomY,
      initialScaleY: PRISTINE_CALIBRATION.initialScaleY,
      fillAxis: "y" as const,
      centerY: PRISTINE_CALIBRATION.centerY,
      totalHeight: PRISTINE_CALIBRATION.totalHeight,
    };
  }, [model]);

  // Direct vertical dragging handler on the 3D model
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || !onInkChange || !calibration) return;
    e.stopPropagation();

    const startY = e.clientY;
    const startPct = Math.max(0, Math.min(100, Math.round(inkPercentage)));

    const onPointerMove = (ev: PointerEvent) => {
      // Delta: moving cursor upward increases ink level
      const deltaY = startY - ev.clientY;
      const sensitivity = 0.45;
      const nextPct = Math.max(0, Math.min(100, Math.round(startPct + deltaY * sensitivity)));
      onInkChange(nextPct);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Uniform scaling: totalHeight (~78 units in GLB) is scaled to ~2.15 units in scene view
  // Strictly uniform scale to preserve user's original Blender model geometry without distortion
  const fitScale = calibration ? 2.15 / Math.max(1, calibration.totalHeight) : 0.0275;

  return (
    <group
      ref={containerRef}
      onPointerDown={handlePointerDown}
      scale={fitScale}
    >
      {/* Flipped on Z axis so metallic writing tip is at the bottom and rear plug is at the top */}
      <group rotation={[0, 0, Math.PI]}>
        <primitive
          object={model}
          position={[0, calibration ? -calibration.centerY : 0, 0]}
        />
      </group>

      {/* Active ink animation controller */}
      {calibration && (
        <InkController
          inkPercentage={inkPercentage}
          inkMesh={calibration.inkMesh}
          anchorWorldY={calibration.anchorWorldY}
          anchorGeomY={calibration.anchorGeomY}
          initialScaleY={calibration.initialScaleY}
          fillAxis={calibration.fillAxis}
          isDarkAnalysisMode={isDarkAnalysisMode}
          colorOverride={colorOverride}
        />
      )}
    </group>
  );
}

// Preload GLB asset
useGLTF.preload("/models/pen-refill.glb");

