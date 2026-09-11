"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trash2,
  ArrowRight,
  PenLine,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { getSavedPredictions, removePredictionFromHistory } from "@/lib/api";
import type { SavedPenPrediction } from "@/types";

export default function HistoryPage() {
  const [savedPens, setSavedPens] = useState<SavedPenPrediction[]>([]);

  useEffect(() => {
    setSavedPens(getSavedPredictions());
  }, []);

  const handleDelete = (id: string) => {
    if (removePredictionFromHistory(id)) {
      setSavedPens((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ambience */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-ink-mint/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-ink-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ink-orange/10 text-ink-orange text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            Your Pen Log
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight">
            Saved Pen Estimates
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Track your stationery collection, remaining mileage, and estimated notebook capacities.
          </p>
        </div>

        <Link
          href="/#estimate"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-ink-blue to-ink-mint text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <Sparkles className="w-4 h-4" />
          Estimate New Pen
        </Link>
      </div>

      {savedPens.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-dashed border-ink-border max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-ink-blue/10 flex items-center justify-center mx-auto text-ink-blue">
            <PenLine className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-ink-navy">No pens saved yet</h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Whenever you estimate ink for a pen, click &quot;Save&quot; to add it to your personal logbook and track how many pages you have left.
          </p>
          <Link
            href="/#estimate"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-ink-navy text-white text-sm font-semibold hover:bg-ink-navy-light transition-colors"
          >
            Start Your First Estimate
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {savedPens.map((pen) => (
              <motion.div
                key={pen.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-3xl p-6 shadow-lg border border-white/80 flex flex-col justify-between hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-ink-navy leading-tight">{pen.nickname}</h3>
                      <p className="text-xs text-ink-muted mt-0.5">{pen.result.penName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(pen.id)}
                      title="Remove pen"
                      className="text-ink-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ink Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-semibold text-ink-muted mb-1">
                      <span>Ink Level</span>
                      <span className="text-ink-blue font-bold">{pen.result.inkPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-ink-border/30">
                      <div
                        className="h-full bg-gradient-to-r from-ink-blue to-ink-mint rounded-full transition-all duration-500"
                        style={{ width: `${pen.result.inkPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Main Metric */}
                  <div className="p-4 rounded-2xl bg-ink-navy/5 border border-ink-navy/10 text-center mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Pages Remaining</div>
                    <div className="text-3xl font-black text-ink-navy my-0.5">
                      {pen.result.estimatedPages.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-ink-muted">
                      in {pen.result.notebookType.replace("_", " ")}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2 rounded-xl bg-white border border-ink-border/40">
                      <div className="text-[10px] text-ink-muted">Remaining Length</div>
                      <div className="font-semibold text-ink-navy mt-0.5">{pen.result.remainingDistanceMeters}m</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-ink-border/40">
                      <div className="text-[10px] text-ink-muted">Writing Pressure</div>
                      <div className="font-semibold text-ink-navy capitalize mt-0.5">{pen.result.writingStyle}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink-border/40 flex items-center justify-between text-[11px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(pen.savedAt).toLocaleDateString()}
                  </span>
                  <Link
                    href="/#estimate"
                    className="font-semibold text-ink-blue hover:underline inline-flex items-center gap-0.5"
                  >
                    Re-estimate <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
