"use client";

import { useState } from "react";
import { BookOpen, Copy, Check, Calculator, ChevronRight } from "lucide-react";

export function MethodologySection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const equations = [
    {
      id: "remaining-distance",
      step: "STEP 01",
      title: "REMAINING DISTANCE",
      latex: "\\text{Remaining distance} = \\text{Total writing distance} \\times \\frac{\\text{Ink percentage}}{100}",
      description: "Computes total linear writing distance remaining in the cartridge based on nominal manufacturer claim and observed fluid column level.",
      render: (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base font-mono text-[var(--foreground)] py-3">
          <span className="font-bold text-[var(--ink-blue)]">Remaining distance</span>
          <span>=</span>
          <span>Total writing distance</span>
          <span>×</span>
          <div className="inline-flex flex-col items-center align-middle px-1">
            <span className="border-b border-[var(--foreground)] px-2 pb-0.5 text-xs sm:text-sm">
              Ink percentage
            </span>
            <span className="pt-0.5 text-xs sm:text-sm">100</span>
          </div>
        </div>
      ),
      example: "3,000m × (65 / 100) = 1,950m remaining",
    },
    {
      id: "usable-distance",
      step: "STEP 02",
      title: "USABLE DISTANCE",
      latex: "\\text{Usable distance} = \\frac{\\text{Remaining distance} \\times 0.85}{\\text{Pressure factor} \\times \\text{Flow adjustment}}",
      description: "Applies real-world 0.85 efficiency coefficient (accounting for cartridge capillary dead-volume and meniscus loss), normalized by handwriting pressure and ink viscosity.",
      render: (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base font-mono text-[var(--foreground)] py-3">
          <span className="font-bold text-[var(--ink-blue)]">Usable distance</span>
          <span>=</span>
          <div className="inline-flex flex-col items-center align-middle px-2">
            <span className="border-b border-[var(--foreground)] px-3 pb-0.5 text-xs sm:text-sm">
              Remaining distance × 0.85
            </span>
            <span className="pt-0.5 text-xs sm:text-sm">
              Pressure factor × Flow adjustment
            </span>
          </div>
        </div>
      ),
      example: "(1,950m × 0.85) / (1.0 × 1.0) = 1,657.5m usable",
    },
    {
      id: "pages-remaining",
      step: "STEP 03",
      title: "PAGES REMAINING",
      latex: "\\text{Pages remaining} = \\left\\lfloor \\frac{\\text{Usable distance}}{\\text{Writing metres per page}} \\right\\rfloor",
      description: "Converts usable meters into physical notebook yield using standardized page line densities, truncated with the floor function ⌊ ⌋ to guarantee complete pages.",
      render: (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base font-mono text-[var(--foreground)] py-3">
          <span className="font-bold text-[var(--ink-blue)]">Pages remaining</span>
          <span>=</span>
          <span className="text-xl sm:text-2xl font-light text-[var(--ink-blue)]">⌊</span>
          <div className="inline-flex flex-col items-center align-middle px-2">
            <span className="border-b border-[var(--foreground)] px-3 pb-0.5 text-xs sm:text-sm">
              Usable distance
            </span>
            <span className="pt-0.5 text-xs sm:text-sm">
              Writing metres per page
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-light text-[var(--ink-blue)]">⌋</span>
        </div>
      ),
      example: "⌊ 1,657.5m / 6.0m ⌋ = 276 Pages (Queen Book)",
    },
  ];

  const handleCopy = (latex: string, index: number) => {
    navigator.clipboard.writeText(latex);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section
      id="methodology"
      className="relative border-b border-[var(--line)] py-16 sm:py-24 px-4 sm:px-8 bg-[var(--surface)] transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* ── Section Header ── */}
        <div className="border-b border-[var(--line)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] block mb-1">
              [ STAGE 02 / MATHEMATICAL FORMULATION ]
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tighter text-[var(--foreground)]">
              02. PREDICTION<br />EQUATIONS
            </h2>
          </div>
          <div className="font-mono text-xs text-[var(--muted)] max-w-sm text-left sm:text-right">
            Governing mathematical model implemented in the prediction engine to convert manufacturer claims into accurate handwriting yields.
          </div>
        </div>

        {/* ── Three Core Equations Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
          {equations.map((eq, idx) => (
            <div
              key={eq.id}
              className="border border-[var(--line)] bg-[var(--background)] p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xs relative group hover:border-[var(--ink-blue)] transition-colors"
            >
              <div>
                {/* Step & Action Bar */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                  <span className="text-[10px] font-bold text-[var(--muted)] tracking-wider">
                    {eq.step}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(eq.latex, idx)}
                    className="flex items-center gap-1 text-[9px] px-2 py-1 border border-[var(--line)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-all cursor-pointer uppercase"
                    title="Copy LaTeX formula"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>LaTeX</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Equation Name */}
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[var(--foreground)] mb-3">
                  {eq.title}
                </h3>

                {/* Visual Mathematical Formula Display */}
                <div className="p-4 border border-[var(--line)] bg-[var(--surface)] my-3 flex items-center justify-center overflow-x-auto min-h-[90px]">
                  {eq.render}
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-3">
                  {eq.description}
                </p>
              </div>

              {/* Sample Worked Calculation */}
              <div className="pt-3 border-t border-[var(--line)]/70 text-[10px] text-[var(--muted)]">
                <span className="text-[var(--foreground)] font-bold block mb-0.5">WORKED BENCHMARK:</span>
                <span className="text-[var(--ink-blue)] font-semibold">{eq.example}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Variable Dictionary & Parameter Matrix ── */}
        <div className="border border-[var(--line)] bg-[var(--background)] p-6 sm:p-8 font-mono space-y-6">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <Calculator className="w-4 h-4 text-[var(--ink-blue)]" />
            <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--foreground)]">
              PARAMETER COEFFICIENT MATRIX
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-[11px]">
            {/* Column 1: Efficiency & Ink Level */}
            <div className="space-y-2">
              <div className="font-bold text-[var(--foreground)] border-b border-[var(--line)]/40 pb-1">
                PHYSICAL COEFFICIENTS
              </div>
              <div>
                <span className="text-[var(--ink-blue)] font-bold">0.85 Efficiency Constant</span>
                <div className="text-[10px] text-[var(--muted)]">
                  Reflects dead-volume in barrel crimp, rollerball socket resistance, and meniscus capillary hold.
                </div>
              </div>
              <div>
                <span className="text-[var(--ink-blue)] font-bold">Ink percentage (0–100%)</span>
                <div className="text-[10px] text-[var(--muted)]">
                  Observed linear ink column calibrated by user or sensor measurement.
                </div>
              </div>
            </div>

            {/* Column 2: Pressure Factors */}
            <div className="space-y-2">
              <div className="font-bold text-[var(--foreground)] border-b border-[var(--line)]/40 pb-1">
                WRITING PRESSURE FACTOR
              </div>
              <ul className="space-y-1 text-[10px]">
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Light hand pressure:</span>
                  <strong className="text-[var(--foreground)]">0.90×</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Normal pressure:</span>
                  <strong className="text-[var(--foreground)]">1.00×</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Heavy pressure:</span>
                  <strong className="text-[var(--foreground)]">1.20×</strong>
                </li>
              </ul>
              <div className="text-[9px] text-[var(--muted)] pt-1">
                Higher pressure spreads the paper fibers and increases ink laydown rate.
              </div>
            </div>

            {/* Column 3: Flow Adjustments */}
            <div className="space-y-2">
              <div className="font-bold text-[var(--foreground)] border-b border-[var(--line)]/40 pb-1">
                FLOW ADJUSTMENT (VISCOSITY)
              </div>
              <ul className="space-y-1 text-[10px]">
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Normal Ballpoint:</span>
                  <strong className="text-[var(--foreground)]">1.00×</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Low-Viscosity Paste:</span>
                  <strong className="text-[var(--foreground)]">1.10×</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Gel Ink:</span>
                  <strong className="text-[var(--foreground)]">1.25×</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Liquid Rollerball:</span>
                  <strong className="text-[var(--foreground)]">1.35×</strong>
                </li>
              </ul>
            </div>

            {/* Column 4: Notebook Yield Densities */}
            <div className="space-y-2">
              <div className="font-bold text-[var(--foreground)] border-b border-[var(--line)]/40 pb-1">
                NOTEBOOK METRES PER PAGE
              </div>
              <ul className="space-y-1 text-[10px]">
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Long Book (30 lines):</span>
                  <strong className="text-[var(--foreground)]">7.2 m/p</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">Queen Book (25 lines):</span>
                  <strong className="text-[var(--foreground)]">6.0 m/p</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-[var(--muted)]">King Book (20 lines):</span>
                  <strong className="text-[var(--foreground)]">4.8 m/p</strong>
                </li>
              </ul>
              <div className="text-[9px] text-[var(--muted)] pt-1">
                Line length normalized at 240mm with 1.0 word density factor.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
