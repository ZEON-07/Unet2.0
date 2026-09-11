"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenLine,
  BarChart3,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Zap,
  Shield,
  Move3d,
  RotateCcw,
} from "lucide-react";
import { InkLifeLoader } from "@/components/3d/InkLifeLoader";
import { RefillSceneLazy, FeatureScene3D } from "@/components/3d/Scene3DLazy";
import { useScrollRefillProgress } from "@/components/3d/ScrollRefillTransition";
import { InkSlider } from "@/components/ui/InkSlider";
import { isMockFallbackActive } from "@/lib/api";

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: "Rate Your Ink",
    description:
      "Drag the slider or slide directly on the 3D refill — our colour-coded scale gives instant visual feedback.",
    icon: PenLine,
    gradient: "from-ink-blue to-ink-blue-light",
    accent: "ink-blue",
  },
  {
    title: "Ink Calculation",
    description:
      "We cross-reference pen brand, ink type, and usage habits against a database of real-world page yields to give you a number.",
    icon: BarChart3,
    gradient: "from-ink-mint-dark to-ink-mint",
    accent: "ink-mint",
  },
  {
    title: "Track Your Pens",
    description:
      "Save estimates, nickname your pens, and keep a dependable ink log over time.",
    icon: Clock,
    gradient: "from-ink-orange to-ink-orange-light",
    accent: "ink-orange",
  },
];

const STATS = [
  { value: "50+", label: "Pen brands" },
  { value: "10K+", label: "Estimates made" },
  { value: "98%", label: "User satisfaction" },
];

const PERKS = [
  { icon: Zap, label: "30-second estimate" },
  { icon: Shield, label: "No account needed" },
  { icon: Clock, label: "Save your history" },
];

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [inkLevel, setInkLevel] = useState(65);
  const [showMockNotice] = useState(() =>
    typeof window !== "undefined" ? isMockFallbackActive() : false
  );

  const isMobile = useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth < 768,
    () => false
  );

  const scrollProgress = useScrollRefillProgress();

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const replayIntro = () => {
    setInkLevel(65);
    setShowIntro(true);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FULL-SCREEN CINEMATIC 3D REFILL LOADER                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showIntro && <InkLifeLoader onComplete={handleIntroComplete} />}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[calc(100vh-72px)] transition-colors duration-700">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-ink-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-40 w-[500px] h-[500px] bg-ink-mint/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-16 md:pt-14 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* ── Left Column: Heading, Slider Card, CTA ──────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -35 }}
              animate={!showIntro ? { opacity: 1, x: 0 } : { opacity: 0, x: -35 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-20 pointer-events-auto"
            >
              {/* Badge + Replay button */}
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={!showIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-blue/6 border border-ink-blue/12 text-xs font-semibold text-ink-blue tracking-wide uppercase shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  The Pen Ink Estimator
                </motion.div>

                {/* Replay Intro Button */}
                {!showIntro && (
                  <button
                    onClick={replayIntro}
                    title="Replay 3D Refill Injection Intro"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:text-ink-navy bg-white/60 hover:bg-white border border-ink-border/40 shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-ink-blue" />
                    Replay intro
                  </button>
                )}
              </div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={!showIntro ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-ink-navy leading-[1.08]"
              >
                How many pages{" "}
                <br className="hidden sm:block" />
                does your pen{" "}
                <br className="hidden sm:block" />
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-ink-blue via-ink-blue-light to-ink-mint bg-clip-text text-transparent">
                    have left?
                  </span>
                  <motion.span
                    className="absolute bottom-1.5 left-0 w-full h-3 bg-ink-mint/20 rounded -z-0"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={!showIntro ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  />
                </span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={!showIntro ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-lg"
              >
                Rate the visible ink.{" "}
                <span className="font-semibold text-ink-navy">
                  We&apos;ll estimate the rest.
                </span>
              </motion.p>

              {/* ── Interactive Ink Gauge Card ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={!showIntro ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="w-full max-w-sm mt-7 glass-card rounded-2xl p-5 shadow-lg border border-white/60"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">
                    Rate Your Ink
                  </p>
                  <span className="text-[11px] font-medium text-ink-blue bg-ink-blue/8 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-blue animate-pulse" />
                    synced with 3D refill
                  </span>
                </div>

                <InkSlider value={inkLevel} onChange={setInkLevel} />

                <AnimatePresence mode="wait">
                  <motion.p
                    key={Math.round(inkLevel / 15)}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-ink-muted text-center mt-3.5 font-medium"
                  >
                    {inkLevel > 80
                      ? "✨ Full tank — ready for countless notebooks!"
                      : inkLevel > 60
                        ? "✍️ Healthy ink level — keep writing freely."
                        : inkLevel > 35
                          ? "🟡 Half full — solid capacity remaining."
                          : inkLevel > 15
                            ? "⚠️ Low ink — keep a refill handy."
                            : "🔴 Empty — time to install a new cartridge!"}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={!showIntro ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto"
              >
                <Link
                  href="/predict"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-ink-blue to-ink-blue-light shadow-xl shadow-ink-blue/25 hover:shadow-ink-blue/35 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get Full Estimate
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-medium text-ink-navy bg-white/70 hover:bg-white/90 border border-ink-border/50 shadow-sm transition-all duration-300"
                >
                  How It Works
                </Link>
              </motion.div>

              {/* Perks row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={!showIntro ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex flex-wrap gap-x-6 gap-y-2 mt-6 justify-center lg:justify-start"
              >
                {PERKS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-xs text-ink-muted"
                  >
                    <Icon className="w-3.5 h-3.5 text-ink-mint-dark" />
                    {label}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── Right Column: 3D Refill Scene ───────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={!showIntro ? { opacity: 1, scale: 1 } : { opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="sticky top-20 h-[520px] lg:h-[620px] w-full flex items-center justify-center pointer-events-auto"
            >
              {/* Tooltip badge */}
              {!showIntro && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-4 right-4 z-20 glass-card rounded-xl px-3 py-1.5 text-[11px] font-medium text-ink-navy/75 flex items-center gap-1.5 shadow-sm pointer-events-none"
                >
                  <Move3d className="w-3.5 h-3.5 text-ink-blue" />
                  Drag to inspect refill
                </motion.div>
              )}

              {/* 3D Master Scene (Persists on Hero and Scroll) */}
              {!showIntro && (
                <RefillSceneLazy
                  mode="hero"
                  inkPercentage={inkLevel}
                  onInkChange={setInkLevel}
                  scrollProgress={isMobile ? 0 : scrollProgress}
                  showOrbs={!isMobile}
                />
              )}

              {/* Bottom interaction cue */}
              {!showIntro && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass-card rounded-xl px-3.5 py-1.5 text-xs font-medium text-ink-muted pointer-events-none flex items-center gap-2 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-ink-mint animate-ping" />
                  ↕ Drag refill or gauge to adjust ink
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={!showIntro ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.1 }}
            className="flex justify-center mt-8 lg:mt-12"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-ink-muted/40"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  STATS BAR                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 border-y border-ink-border/20 bg-white/30 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-ink-blue to-ink-mint bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-ink-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FEATURES + 3D REFILL TRIO                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Feature text cards */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-ink-navy">
                  Three steps to{" "}
                  <span className="bg-gradient-to-r from-ink-blue to-ink-mint bg-clip-text text-transparent">
                    ink clarity
                  </span>
                </h2>
                <p className="mt-3 text-ink-muted">
                  No refill anxiety. No guessing. Just clear, dependable pen math.
                </p>
              </motion.div>

              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ x: 4 }}
                  className="glass-card group rounded-2xl p-6 flex gap-5 cursor-default"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink-navy mb-1">{f.title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{f.description}</p>
                  </div>
                  <div className="ml-auto flex-shrink-0 text-4xl font-black text-ink-navy/[0.04] self-center">
                    {i + 1}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 3D refill trio */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="h-[420px] relative"
            >
              <FeatureScene3D />

              {/* Labels */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-ink-muted">
                {["High", "Medium", "Low"].map((label) => (
                  <span key={label} className="glass-card px-3 py-1 rounded-full">
                    {label} ink
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CTA BAND                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl px-6"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-ink-navy via-ink-navy-light to-ink-navy overflow-hidden px-8 py-16 sm:px-14 text-center">
            {/* Glow orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-ink-blue/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-ink-mint/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-ink-orange/5 rounded-full blur-2xl" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-4xl mb-4"
              >
                🖊️
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Ready to find out?
              </h2>
              <p className="mt-3 text-white/55 max-w-md mx-auto leading-relaxed">
                Grab any pen, rate the ink level, and let InkLife do the
                maths. It takes less than 30 seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Link
                  href="/predict"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-ink-navy bg-gradient-to-r from-ink-mint to-ink-mint-dark hover:opacity-90 shadow-xl shadow-ink-mint/20 transition-all hover:-translate-y-0.5"
                >
                  Estimate Your Ink
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium text-white/80 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                >
                  <Clock className="w-4 h-4" />
                  View History
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mock fallback notice */}
      {showMockNotice && (
        <div className="mock-notice">⚡ Using demo data — backend not connected</div>
      )}
    </>
  );
}
