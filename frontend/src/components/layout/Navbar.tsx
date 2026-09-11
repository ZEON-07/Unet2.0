"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Estimate", href: "/predict" },
  { label: "History", href: "/history" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full"
    >
      {/* Glassmorphism bar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/60 border-b border-white/40 supports-[backdrop-filter]:bg-white/40">
        {/* ─── Logo ──────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: -12 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-ink-blue to-ink-mint shadow-md"
          >
            <PenLine className="w-5 h-5 text-white" strokeWidth={2.2} />
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-ink-navy">
            Ink<span className="text-ink-blue">Life</span>
          </span>
        </Link>

        {/* ─── Desktop links ────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`ink-underline relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "active text-ink-blue"
                      : "text-ink-navy/70 hover:text-ink-navy hover:bg-white/50"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-ink-blue/5 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ─── CTA ──────────────────────────────────────────────── */}
        <div className="hidden md:block">
          <Link
            href="/predict"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-ink-blue to-ink-blue-light hover:from-ink-blue-light hover:to-ink-blue shadow-lg shadow-ink-blue/20 hover:shadow-ink-blue/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <PenLine className="w-4 h-4" />
            Estimate Ink
          </Link>
        </div>

        {/* ─── Mobile toggle ────────────────────────────────────── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/50 transition-colors text-ink-navy"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* ─── Mobile menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden backdrop-blur-xl bg-white/80 border-b border-white/40"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-ink-blue/10 text-ink-blue"
                          : "text-ink-navy/70 hover:bg-white/60 hover:text-ink-navy"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.05 }}
                className="pt-2"
              >
                <Link
                  href="/predict"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-ink-blue to-ink-blue-light shadow-lg shadow-ink-blue/20"
                >
                  <PenLine className="w-4 h-4" />
                  Estimate Ink
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
