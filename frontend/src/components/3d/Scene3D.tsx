"use client";

import { useRef, useMemo, useState, Component, type ReactNode } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";

// ─── Error boundary to catch any WebGL issues ────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class CanvasErrorBoundary extends Component<
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
    console.warn("3D Canvas rendering notice:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
            <div className="w-16 h-16 rounded-2xl bg-ink-blue/10 flex items-center justify-center text-ink-blue text-2xl mb-2">
              ✒️
            </div>
            <p className="text-xs font-medium">Interactive Preview</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ─── Floating Ink Orb ────────────────────────────────────────────────────────
function InkOrb({
  position,
  color,
  size,
  speed,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.4) * 0.3;
    meshRef.current.rotation.y += 0.006 * speed;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * speed * 1.2) * 0.05;
    meshRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.15}
          metalness={0.1}
          transmission={0.4}
          thickness={0.5}
          transparent
          opacity={0.65}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          emissive={color}
          emissiveIntensity={0.18}
        />
      </mesh>
    </Float>
  );
}

// ─── 3D Pen Refill Model (Authentic transparent cartridge + slider) ─────────
export function Refill3D({
  inkPercentage,
  onInkChange,
  interactive = false,
  scale = 1.0,
}: {
  inkPercentage: number;
  onInkChange?: (val: number) => void;
  interactive?: boolean;
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const clamp = Math.max(0, Math.min(100, inkPercentage));

  // Dynamic ink fluid color
  const inkColor = useMemo(() => {
    if (clamp > 60) return "#2563EB"; // Royal blue
    if (clamp > 30) return "#0D9488"; // Teal / emerald
    if (clamp > 10) return "#F59E0B"; // Warning amber
    return "#EF4444"; // Critical red
  }, [clamp]);

  // Gentle floating tilt when not dragging
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isDragging) {
      groupRef.current.rotation.x =
        0.22 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
      groupRef.current.rotation.z =
        0.10 + Math.cos(state.clock.elapsedTime * 0.4) * 0.03;
    }
  });

  // ── Dimensions ──
  // The refill tube runs from Y = -1.0 (metal crimp) to Y = 2.0 (end plug).
  // Total usable ink travel = 2.7 units (from 0% at -1.0 to 100% at 1.7).
  const baseY = -1.0;
  const travelHeight = 2.7;
  const inkHeight = Math.max(0.04, (clamp / 100) * travelHeight);
  const inkTopY = baseY + inkHeight;
  const inkCenterY = baseY + inkHeight / 2;

  // Follower gel (the clear amber silicone grease plug that seals ink in a gel refill)
  const followerHeight = 0.32;
  const followerCenterY = inkTopY + followerHeight / 2;

  // ── Drag Interaction ──
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || !onInkChange) return;
    e.stopPropagation();

    // 1. Direct jump based on where was clicked
    if (groupRef.current) {
      const local = groupRef.current.worldToLocal(e.point.clone());
      const pct = Math.round(((local.y - baseY) / travelHeight) * 100);
      onInkChange(Math.max(0, Math.min(100, pct)));
    }

    // 2. Smooth continuous drag tracking via window listeners
    const startY = e.clientY;
    const startPct = clamp;
    setIsDragging(true);

    const onPointerMove = (ev: PointerEvent) => {
      // Dragging UP (lower clientY) increases ink; dragging DOWN decreases ink
      const deltaY = startY - ev.clientY;
      const sensitivity = 0.55; // 180px for full range
      const nextPct = Math.max(
        0,
        Math.min(100, Math.round(startPct + deltaY * sensitivity))
      );
      onInkChange(nextPct);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Calibration tick percentage levels
  const ticks = [0, 25, 50, 75, 100];

  return (
    <group
      ref={groupRef}
      scale={scale}
      rotation={[0.22, 0.38, 0.10]}
      position={[0, -0.1, 0]}
    >
      {/* ── 1. Clear Plastic Refill Tube ── */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 3.0, 32]} />
        <meshPhysicalMaterial
          color="#F0F8FF"
          transmission={0.93}
          roughness={0.06}
          thickness={0.25}
          transparent
          opacity={0.58}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          reflectivity={0.65}
          ior={1.46}
        />
      </mesh>

      {/* ── 2. Calibration Ticks Etched on Tube ── */}
      {ticks.map((t) => {
        const tickY = baseY + (t / 100) * travelHeight;
        return (
          <group key={t} position={[0, tickY, 0]}>
            {/* Fine ring mark around tube */}
            <mesh>
              <torusGeometry args={[0.166, 0.004, 12, 48]} />
              <meshStandardMaterial
                color={t === 0 || t === 100 ? "#0D1B2A" : "#64748B"}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
            {/* Left measurement notch tab */}
            <mesh position={[-0.18, 0, 0]}>
              <boxGeometry args={[0.04, 0.015, 0.015]} />
              <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* ── 3. The Ink Column (Liquid inside tube) ── */}
      {clamp > 0 && (
        <mesh position={[0, inkCenterY, 0]}>
          <cylinderGeometry args={[0.145, 0.145, inkHeight, 32]} />
          <meshPhysicalMaterial
            color={inkColor}
            roughness={0.12}
            metalness={0.04}
            transmission={0.18}
            transparent
            opacity={0.94}
            emissive={inkColor}
            emissiveIntensity={isDragging || isHovered ? 0.35 : 0.22}
            clearcoat={0.6}
          />
        </mesh>
      )}

      {/* Ink top meniscus disc */}
      {clamp > 0 && (
        <mesh position={[0, inkTopY, 0]}>
          <cylinderGeometry args={[0.145, 0.145, 0.015, 32]} />
          <meshStandardMaterial
            color={inkColor}
            roughness={0.05}
            emissive={inkColor}
            emissiveIntensity={0.4}
          />
        </mesh>
      )}

      {/* ── 4. Follower Gel (Silicone grease plug above ink) ── */}
      {followerCenterY < 1.95 && (
        <mesh position={[0, followerCenterY, 0]}>
          <cylinderGeometry args={[0.144, 0.144, followerHeight, 32]} />
          <meshPhysicalMaterial
            color="#FEF3C7" // Warm translucent silicone grease
            roughness={0.18}
            metalness={0.02}
            transmission={0.85}
            thickness={0.4}
            transparent
            opacity={0.6}
            clearcoat={0.7}
          />
        </mesh>
      )}

      {/* ── 5. End Plug (Rear of refill cartridge at top) ── */}
      {/* Inserted stopper neck */}
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.142, 0.142, 0.2, 32]} />
        <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Outer flange lip */}
      <mesh position={[0, 2.06, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 32]} />
        <meshStandardMaterial color={inkColor} roughness={0.35} metalness={0.3} />
      </mesh>
      {/* Top cap fin / breather channel */}
      <mesh position={[0, 2.14, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.1, 32]} />
        <meshStandardMaterial color="#0F172A" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* ── 6. Front Metal Tip Assembly (Stainless steel + rollerball) ── */}
      {/* Nickel/brass crimped collar joining tube to tip */}
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[0.168, 0.158, 0.18, 32]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.92} />
      </mesh>
      {/* Gold/brass accent shoulder ring */}
      <mesh position={[0, -1.18, 0]}>
        <cylinderGeometry args={[0.172, 0.172, 0.05, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Slender stainless steel pipe neck */}
      <mesh position={[0, -1.38, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.38, 32]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.15} metalness={0.95} />
      </mesh>
      {/* Machined precision writing cone tip */}
      <mesh position={[0, -1.66, 0]}>
        <coneGeometry args={[0.072, 0.3, 32]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.92} />
      </mesh>
      {/* Tungsten carbide rollerball socket & ball */}
      <mesh position={[0, -1.82, 0]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color={inkColor}
          roughness={0.1}
          emissive={inkColor}
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Droplet at tip when ink is low */}
      {clamp < 20 && clamp > 0 && (
        <mesh position={[0, -1.89, 0]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial
            color={inkColor}
            transparent
            opacity={0.88}
            emissive={inkColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* ── 7. Interactive 3D Slider Collar Ring (Located right on ink level) ── */}
      {interactive && (
        <group position={[0, inkTopY, 0]}>
          {/* Chrome / gold collar ring that hugs the refill tube */}
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 32]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.15}
              metalness={0.95}
            />
          </mesh>
          {/* Colored luminous indicator stripe around the collar */}
          <mesh>
            <cylinderGeometry args={[0.222, 0.222, 0.03, 32]} />
            <meshStandardMaterial
              color={inkColor}
              roughness={0.2}
              emissive={inkColor}
              emissiveIntensity={isDragging ? 1.0 : 0.65}
            />
          </mesh>
          {/* Left/right grip tabs */}
          {[-0.23, 0.23].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.05, 0.06, 0.05]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.3} metalness={0.8} />
            </mesh>
          ))}

          {/* 3D Floating pill badge attached directly to slider ring */}
          <Html position={[0.42, 0, 0]} center pointerEvents="none">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md transition-all duration-200 select-none whitespace-nowrap ${
                isDragging
                  ? "bg-ink-navy text-white border-ink-mint scale-110 shadow-ink-mint/20"
                  : isHovered
                    ? "bg-ink-navy/90 text-white border-white/30 scale-105"
                    : "bg-white/80 text-ink-navy border-ink-border/40"
              }`}
            >
              <span className="text-[11px] text-ink-mint font-bold">↕</span>
              <span>{Math.round(clamp)}%</span>
              <span className="text-[10px] opacity-70 font-normal">
                {isDragging ? "sliding" : "slide here"}
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ── 8. Invisible hit-box cylinder for fluid click & drag ── */}
      {interactive && (
        <mesh
          position={[0, 0.45, 0]}
          onPointerDown={handlePointerDown}
          onPointerOver={() => {
            setIsHovered(true);
            document.body.style.cursor = "ns-resize";
          }}
          onPointerOut={() => {
            setIsHovered(false);
            if (!isDragging) document.body.style.cursor = "";
          }}
        >
          <cylinderGeometry args={[0.48, 0.48, 3.2, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ─── Floating ink particles ──────────────────────────────────────────────────
function InkParticles({ count = 50 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pseudoRand = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#2563EB"),
      new THREE.Color("#7DE2D1"),
      new THREE.Color("#F59E0B"),
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRand(i * 3 + 1) - 0.5) * 10;
      pos[i * 3 + 1] = (pseudoRand(i * 3 + 2) - 0.5) * 8;
      pos[i * 3 + 2] = (pseudoRand(i * 3 + 3) - 0.5) * 6;

      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Main Hero 3D Scene ──────────────────────────────────────────────────────
export function HeroScene({
  inkPercentage,
  onInkChange,
}: {
  inkPercentage: number;
  onInkChange?: (val: number) => void;
}) {
  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 5.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <hemisphereLight args={["#ffffff", "#0D1B2A", 0.55]} />
        <directionalLight position={[5, 7, 5]} intensity={1.3} color="#ffffff" />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#7DE2D1" />
        <pointLight position={[0, 3, 3]} intensity={0.9} color="#2563EB" />
        <pointLight position={[-3, -1, 2]} intensity={0.6} color="#F59E0B" />

        {/* Floating accent orbs */}
        <InkOrb position={[-2.8, 1.4, -1.8]} color="#2563EB" size={0.38} speed={1.1} />
        <InkOrb position={[3.0, -0.8, -2.2]} color="#7DE2D1" size={0.45} speed={0.8} />
        <InkOrb position={[-2.2, -1.8, -1]} color="#F59E0B" size={0.28} speed={1.3} />
        <InkOrb position={[2.2, 1.8, -2]} color="#2563EB" size={0.32} speed={0.9} />

        {/* Ambient ink floating particles */}
        <InkParticles count={45} />

        {/* Main interactive 3D pen refill with integrated slider */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
          <Refill3D
            inkPercentage={inkPercentage}
            onInkChange={onInkChange}
            interactive={true}
          />
        </Float>
      </Canvas>
    </CanvasErrorBoundary>
  );
}

// ─── Small floating refills for feature section ──────────────────────────────
function MiniRefillGroup() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.22;
  });

  const refills = [
    { pos: [-1.4, 0, 0] as [number, number, number], ink: 85 },
    { pos: [0, 0.25, 0] as [number, number, number], ink: 50 },
    { pos: [1.4, -0.1, 0] as [number, number, number], ink: 18 },
  ];

  return (
    <group ref={groupRef}>
      {refills.map((r, i) => (
        <Float key={i} speed={1 + i * 0.3} floatIntensity={0.5}>
          <group position={r.pos} scale={0.65} rotation={[0.2, i * 0.8, 0.1]}>
            <Refill3D inkPercentage={r.ink} />
          </group>
        </Float>
      ))}
    </group>
  );
}

export function FeatureScene() {
  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 6.8], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <hemisphereLight args={["#ffffff", "#0D1B2A", 0.5]} />
        <directionalLight position={[4, 5, 4]} intensity={1.1} />
        <pointLight position={[0, 2, 3]} intensity={0.7} color="#2563EB" />
        <pointLight position={[-2, -2, 2]} intensity={0.5} color="#7DE2D1" />
        <MiniRefillGroup />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
