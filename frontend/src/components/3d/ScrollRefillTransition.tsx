"use client";

import { useState, useEffect } from "react";

/**
 * Hook to track scroll progress across the hero and top content
 * Returns progress from 0 (at top of hero) to 1 (scrolled past hero)
 */
export function useScrollRefillProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      // Hero height roughly 700px; interpolate 0 to 1 over first 600px of scroll
      const rawProgress = Math.min(1, Math.max(0, scrollY / 600));
      setProgress(rawProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}

export function ScrollRefillTransition({
  children,
}: {
  children: (progress: number) => React.ReactNode;
}) {
  const progress = useScrollRefillProgress();
  return <>{children(progress)}</>;
}
