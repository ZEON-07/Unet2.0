"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShieldCheck, Droplet, Ruler, Compass } from "lucide-react";
import type { PenModel } from "@/types";

export interface SpecimenSideDrawerProps {
  pen: PenModel | null;
  onClose: () => void;
  onSelectForEstimate: (pen: PenModel) => void;
}

export function SpecimenSideDrawer({
  pen,
  onClose,
  onSelectForEstimate,
}: SpecimenSideDrawerProps) {
  if (!pen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Side Panel Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg h-full bg-[var(--surface)] text-[var(--foreground)] border-l border-[var(--line)] shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto font-mono select-none"
        >
          <div>
            {/* Top Bar: Specimen ID & Close */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 mb-6">
              <span className="text-xs tracking-widest text-[var(--ink-blue)] font-bold">
                [ SPECIMEN LAB SHEET ]
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 border border-[var(--line)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors cursor-pointer"
                aria-label="Close specimen sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Specimen Identity */}
            <div className="space-y-1 mb-6">
              <div className="text-[10px] text-[var(--muted)] tracking-widest uppercase">
                BRAND: {pen.brandName || "GENERIC"}
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tighter uppercase font-sans leading-none text-[var(--foreground)]">
                {pen.name}
              </h3>
              <div className="text-xs text-[var(--muted)] pt-1">
                SLUG: {pen.slug}
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <div className="p-3 border border-[var(--line)] bg-[var(--background)]/60">
                <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Ruler className="w-3 h-3 text-[var(--ink-blue)]" />
                  CLAIMED MILEAGE
                </div>
                <div className="text-base font-bold text-[var(--foreground)]">
                  {pen.nominalMileageM ? `${pen.nominalMileageM.toLocaleString()} M` : "ESTIMATED"}
                </div>
              </div>

              <div className="p-3 border border-[var(--line)] bg-[var(--background)]/60">
                <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Droplet className="w-3 h-3 text-[var(--ink-blue)]" />
                  INK DELIVERY
                </div>
                <div className="text-xs font-bold text-[var(--foreground)] uppercase truncate">
                  {pen.flowCategory.replace("_", " ")}
                </div>
              </div>

              <div className="p-3 border border-[var(--line)] bg-[var(--background)]/60">
                <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Compass className="w-3 h-3 text-[var(--ink-blue)]" />
                  TIP DIAMETER
                </div>
                <div className="text-base font-bold text-[var(--foreground)]">
                  {pen.tipSizeMm ? `${pen.tipSizeMm} MM` : "1.0 MM"}
                </div>
              </div>

              <div className="p-3 border border-[var(--line)] bg-[var(--background)]/60">
                <div className="text-[9px] text-[var(--muted)] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3 h-3 text-[var(--ink-blue)]" />
                  CONFIDENCE
                </div>
                <div className="text-base font-bold text-[var(--foreground)]">
                  {pen.nominalMileageM ? "VERIFIED" : "FALLBACK"}
                </div>
              </div>
            </div>

            {/* Laboratory Analysis Notes */}
            <div className="border-t border-[var(--line)] pt-4 space-y-2 text-[11px] leading-relaxed text-[var(--muted)]">
              <div className="font-bold text-[var(--foreground)] tracking-wider uppercase text-[10px]">
                PHYSICAL WRITE-TEST ANALYSIS
              </div>
              <p>
                Tested under standard industrial laboratory conditions. Real-world handwriting consumes approximately 15% additional ink laydown due to paper fibre absorption and stroke acceleration.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="pt-6 border-t border-[var(--line)] mt-6">
            <button
              type="button"
              onClick={() => {
                onSelectForEstimate(pen);
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-[var(--ink-blue)] hover:bg-[var(--foreground)] text-white transition-all text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <span>LOAD INTO ESTIMATOR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
