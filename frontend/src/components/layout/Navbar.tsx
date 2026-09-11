"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInkMode } from "@/components/providers/InkModeProvider";
import { Menu, X, Globe, Sun, Moon } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { mode, toggleMode } = useInkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeString, setTimeString] = useState("");
  const [cityCode, setCityCode] = useState("LAB");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = tz.split("/");
      const city = parts[parts.length - 1].replace("_", " ").substring(0, 3).toUpperCase();
      setCityCode(city || "ZUR");
    } catch {
      setCityCode("ZUR");
    }

    const updateTime = () => {
      const d = new Date();
      setTimeString(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: "CALCULATOR", href: "/#estimate" },
    { label: "SPECIMENS", href: "/#specimens" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--line)] transition-colors duration-400">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
        {/* ── Top Left: Brand / Editorial Logotype ── */}
        <Link href="/" className="flex flex-col text-left group">
          <span className="font-extrabold text-sm sm:text-base tracking-tighter text-[var(--foreground)] uppercase leading-none flex items-center gap-1.5">
            INKLIFE<span className="text-[10px] text-[var(--ink-blue)] font-mono">®</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase mt-0.5">
            INK ESTIMATION LAB
          </span>
        </Link>

        {/* ── Top Centre: Editorial Navigation Links ── */}
        <nav className="hidden lg:flex items-center gap-6 text-[11px] font-mono tracking-wider">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href.startsWith("/#") && pathname === "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`transition-colors py-1 relative hover:text-[var(--ink-blue)] ${
                  isActive ? "text-[var(--foreground)] font-semibold" : "text-[var(--muted)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Top Right: Local Time & "Change Ink Mode" ── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Local Time Display */}
          <div className="hidden sm:flex flex-col text-right font-mono text-[9px] leading-tight text-[var(--muted)]">
            <span className="tracking-widest uppercase">LOCAL TIME</span>
            <span className="text-[var(--foreground)] font-bold">
              {cityCode} {timeString || "00:00"}
            </span>
          </div>

          <div className="hidden sm:block w-[1px] h-6 bg-[var(--line)]" />

          {/* Change Ink Mode Button (inspired by "Change Reality") */}
          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-[var(--foreground)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all cursor-pointer shadow-xs active:scale-95"
            title="Toggle between Light paper lab and Dark ultraviolet analysis mode"
          >
            <Globe className="w-3 h-3 text-[var(--ink-blue)]" />
            <span>CHANGE INK MODE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-blue)]" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 border border-[var(--line)] text-[var(--foreground)]"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[var(--line)] bg-[var(--background)] p-4 space-y-3 font-mono text-xs">
          <div className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-1.5 border-b border-[var(--line)]/50 text-[var(--foreground)] hover:text-[var(--ink-blue)] flex justify-between items-center"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-[var(--muted)]">→</span>
              </Link>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-[10px] text-[var(--muted)] font-mono">
            <span>LOCAL: {cityCode} {timeString}</span>
            <button
              onClick={() => {
                toggleMode();
                setMobileOpen(false);
              }}
              className="px-2 py-1 border border-[var(--foreground)] text-[var(--foreground)] font-bold"
            >
              MODE: {mode.toUpperCase()}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
