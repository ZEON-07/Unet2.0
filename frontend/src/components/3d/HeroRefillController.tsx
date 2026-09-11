"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

interface HeroRefillControllerProps {
  mode: "intro" | "hero";
  introTransitionProgress?: number; // 0 (centered vertical) -> 1 (hero diagonal right)
  scrollProgress?: number; // 0 -> 1 based on page scroll
  children: React.ReactNode;
  enableDragInspect?: boolean;
}

export function HeroRefillController({
  mode,
  introTransitionProgress = 1,
  scrollProgress = 0,
  children,
  enableDragInspect = true,
}: HeroRefillControllerProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Drag-to-inspect rotation state (clamped to prevent disorientation)
  const [inspectRotation, setInspectRotation] = useState({ x: 0, y: 0 });
  const [isDraggingInspect, setIsDraggingInspect] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  // Mouse tilt pointer coordinates (-1 to 1)
  const mouseTiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseTiltRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!enableDragInspect || mode !== "hero") return;
    // Only inspect drag if shift key or primary button drag
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: inspectRotation.x,
      rotY: inspectRotation.y,
    };
    setIsDraggingInspect(true);

    const onPointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - dragStartRef.current.x) * 0.005;
      const dy = (ev.clientY - dragStartRef.current.y) * 0.005;
      setInspectRotation({
        // Clamp rotation within +/- 0.55 radians (~30 degrees) to prevent disorientation
        x: Math.max(-0.45, Math.min(0.45, dragStartRef.current.rotX + dy)),
        y: Math.max(-0.65, Math.min(0.65, dragStartRef.current.rotY + dx)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDraggingInspect(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Target positions
    // In Hero column: x = 0 is dead center of the right column!
    // On scroll: glides slightly right and scales down gracefully
    const heroTargetX = scrollProgress * 0.35;
    const heroTargetY = -0.05 - scrollProgress * 0.2;
    const targetX = THREE.MathUtils.lerp(0, heroTargetX, introTransitionProgress);
    const targetY = THREE.MathUtils.lerp(0, heroTargetY, introTransitionProgress);
    const targetZ = 0;

    groupRef.current.position.x = THREE.MathUtils.damp(
      groupRef.current.position.x,
      targetX,
      6,
      delta
    );
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetY,
      6,
      delta
    );
    groupRef.current.position.z = THREE.MathUtils.damp(
      groupRef.current.position.z,
      targetZ,
      6,
      delta
    );

    // Target scale: 1.05 in hero, gently scaling to 0.85 on scroll
    const heroScale = 1.05 - scrollProgress * 0.2;
    const targetScale = THREE.MathUtils.lerp(1.15, heroScale, introTransitionProgress);

    groupRef.current.scale.setScalar(
      THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 6, delta)
    );

    // Target rotation
    // Intro: [0, 0, 0] (vertical)
    // Hero: [0.22, 0.38, 0.10] + mouse tilt + inspect drag + subtle breathing
    const breathing = Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    const mouseTiltX = mouseTiltRef.current.y * 0.08;
    const mouseTiltY = mouseTiltRef.current.x * 0.12;

    const heroRotX = 0.22 + inspectRotation.x + mouseTiltX + breathing;
    const heroRotY = 0.38 + inspectRotation.y + mouseTiltY + scrollProgress * 0.4;
    const heroRotZ = 0.10 + inspectRotation.y * 0.2;

    const targetRotX = THREE.MathUtils.lerp(0, heroRotX, introTransitionProgress);
    const targetRotY = THREE.MathUtils.lerp(0, heroRotY, introTransitionProgress);
    const targetRotZ = THREE.MathUtils.lerp(0, heroRotZ, introTransitionProgress);

    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetRotX,
      6,
      delta
    );
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      6,
      delta
    );
    groupRef.current.rotation.z = THREE.MathUtils.damp(
      groupRef.current.rotation.z,
      targetRotZ,
      6,
      delta
    );
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerOver={() => {
        if (mode === "hero") document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!isDraggingInspect) document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}
