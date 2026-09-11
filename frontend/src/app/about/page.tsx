"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  PenLine,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Search,
  Activity,
  Cpu,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Background Glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-ink-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-ink-mint/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-blue/10 text-ink-blue text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          The Science of Pen Mileage
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-ink-navy tracking-tight leading-tight">
          How InkLife Calculates Your Pages
        </h1>
        <p className="mt-4 text-lg text-ink-muted leading-relaxed">
          Behind our playful 3D refill is a deterministic calculation engine that models
          ink viscosity, paper absorption, line length, and manufacturer laboratory benchmarks.
        </p>
      </div>

      {/* Core Columns */}
      <div className="space-y-12">
        {/* Section 1: The Physics of Writing Distance */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-lg border border-white/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-ink-blue/10 flex items-center justify-center text-ink-blue">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-navy">1. Physics &amp; Viscosity Flow Factors</h2>
              <p className="text-xs text-ink-muted">Not all pens lay down the same volume of ink per meter.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-ink-muted leading-relaxed">
            <p>
              Traditional ballpoint pens (like the classic BIC Cristal) use high-viscosity paste ink.
              They yield impressive lengths—often exceeding <strong>3,000 meters</strong> on a single refill.
            </p>
            <p>
              By contrast, gel and liquid rollerball pens utilize low-viscosity water-based formulations.
              They provide rich, vibrant lines but consume ink up to <strong>1.5&times; faster</strong>,
              translating to fewer written pages per milliliter.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 rounded-2xl bg-white border border-ink-border/50 text-center">
              <div className="text-xs font-bold text-ink-navy">Ballpoint</div>
              <div className="text-xs text-ink-blue font-semibold mt-0.5">Flow: 1.0&times;</div>
              <div className="text-[10px] text-ink-muted">~2,000–3,000m</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-ink-border/50 text-center">
              <div className="text-xs font-bold text-ink-navy">Hybrid Gel</div>
              <div className="text-xs text-ink-blue font-semibold mt-0.5">Flow: 1.3&times;</div>
              <div className="text-[10px] text-ink-muted">~1,200m</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-ink-border/50 text-center">
              <div className="text-xs font-bold text-ink-navy">Rollerball</div>
              <div className="text-xs text-ink-blue font-semibold mt-0.5">Flow: 1.5&times;</div>
              <div className="text-[10px] text-ink-muted">~900m</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-ink-border/50 text-center">
              <div className="text-xs font-bold text-ink-navy">Felt / Fineliner</div>
              <div className="text-xs text-ink-blue font-semibold mt-0.5">Flow: 1.4&times;</div>
              <div className="text-[10px] text-ink-muted">~600–800m</div>
            </div>
          </div>
        </div>

        {/* Section 2: Notebook Math */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-lg border border-white/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-ink-mint/20 flex items-center justify-center text-ink-navy">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-navy">2. Notebook Dimensions &amp; Character Lengths</h2>
              <p className="text-xs text-ink-muted">Converting meters of ink into tangible handwritten pages.</p>
            </div>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            A page is not just a page—the physical ruling and width determine how much line distance is traversed:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-ink-border/50">
              <h3 className="font-bold text-ink-navy text-sm">Long Book</h3>
              <p className="text-xs text-ink-muted mt-1">Full tall ruled journal (30 lines). Consumes ~3.4 meters of continuous handwriting per filled page.</p>
            </div>
            <div className="p-4 rounded-2xl bg-ink-mint/10 border border-ink-mint/30">
              <h3 className="font-bold text-ink-navy text-sm">Queen Book</h3>
              <p className="text-xs text-ink-navy/80 mt-1">Standard medium exercise book (25 lines). Consumes ~4.0 meters of ink per page accounting for margin spacing.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-ink-border/50">
              <h3 className="font-bold text-ink-navy text-sm">King Book</h3>
              <p className="text-xs text-ink-muted mt-1">Broad wide-ruled register (20 lines). Consumes ~4.8 meters per page with expansive line width.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Machine Learning & Search Pipeline */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-lg border border-white/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-ink-orange/10 flex items-center justify-center text-ink-orange">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-navy">3. Automated Claim Discovery Pipeline</h2>
              <p className="text-xs text-ink-muted">Continual indexing of manufacturer claims and laboratory tests.</p>
            </div>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            Our Cloudflare Worker backend features an automated web-search lookup pipeline powered by Tavily AI.
            Whenever users enter a new pen model, the system queries technical datasheets, converts imperial/metric claims
            into normalized writing meters, and queues findings for admin moderation.
          </p>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="mt-16 text-center">
        <Link
          href="/#estimate"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-ink-blue to-ink-mint shadow-xl shadow-ink-blue/20 hover:shadow-ink-blue/30 transition-all hover:-translate-y-0.5"
        >
          Try the Calculator Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
