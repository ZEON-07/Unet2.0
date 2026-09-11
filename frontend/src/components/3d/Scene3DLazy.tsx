"use client";

import { Suspense, lazy } from "react";
import { WebGLFallback } from "@/components/3d/WebGLFallback";
import type { RefillSceneProps } from "@/components/3d/RefillScene";

// Lazy-load 3D scenes so they don't block SSR or initial HTML
const RefillSceneInner = lazy(() =>
  import("@/components/3d/RefillScene").then((m) => ({
    default: m.RefillScene,
  }))
);

const FeatureSceneInner = lazy(() =>
  import("@/components/3d/Scene3D").then((m) => ({ default: m.FeatureScene }))
);

export function RefillSceneLazy(props: RefillSceneProps) {
  return (
    <Suspense
      fallback={
        <WebGLFallback inkPercentage={props.inkPercentage} />
      }
    >
      <RefillSceneInner {...props} />
    </Suspense>
  );
}

export function FeatureScene3D() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-ink-mint/20 border-t-ink-mint animate-spin" />
        </div>
      }
    >
      <FeatureSceneInner />
    </Suspense>
  );
}
