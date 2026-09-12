"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
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
    { label: "METHODOLOGY", href: "/#methodology" },
    { label: "SPECIMENS", href: "/#specimens" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--line)] transition-colors duration-400">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2.5">
        {/* ── Top Left: Brand / Editorial Logotype ── */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 text-left group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--surface)] shadow-xs group-hover:border-[var(--ink-blue)] transition-colors flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="മഷി ഉണ്ടോ മാഷേ ? Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain p-0.5"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[var(--foreground)] leading-none flex items-center gap-1.5">
              മഷി ഉണ്ടോ മാഷേ ?
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-[var(--ink-blue)] uppercase mt-1">
              MASHI UNDO MASHE? • INK LAB
            </span>
          </div>
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

        {/* ── Top Right: Local Time ── */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Local Time Display */}
          <div className="flex flex-col text-right font-mono text-[9px] leading-tight text-[var(--muted)]">
            <span className="tracking-widest uppercase">LOCAL TIME</span>
            <span className="text-[var(--foreground)] font-bold">
              {cityCode} {timeString || "00:00"}
            </span>
          </div>

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
          </div>
        </div>
      )}
    </header>
  );
}
