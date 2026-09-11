"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type InkMode = "light" | "dark";

interface InkModeContextType {
  mode: InkMode;
  toggleMode: () => void;
  setMode: (mode: InkMode) => void;
}

const InkModeContext = createContext<InkModeContextType>({
  mode: "light",
  toggleMode: () => {},
  setMode: () => {},
});

export function InkModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<InkMode>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("inklife-mode") as InkMode | null;
      if (saved === "dark" || saved === "light") {
        setModeState(saved);
        document.documentElement.setAttribute("data-ink-mode", saved);
      } else {
        document.documentElement.setAttribute("data-ink-mode", "light");
      }
    } catch {
      // Fallback in case localStorage is restricted
      document.documentElement.setAttribute("data-ink-mode", "light");
    }
  }, []);

  const setMode = (newMode: InkMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("inklife-mode", newMode);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.setAttribute("data-ink-mode", newMode);
  };

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
  };

  return (
    <InkModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </InkModeContext.Provider>
  );
}

export function useInkMode() {
  return useContext(InkModeContext);
}
