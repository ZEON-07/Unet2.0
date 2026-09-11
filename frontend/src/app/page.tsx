"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Move3d,
  RotateCcw,
  BookOpen,
  Gauge,
  Save,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Info,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { InkLifeLoader } from "@/components/3d/InkLifeLoader";
import { RefillSceneLazy } from "@/components/3d/Scene3DLazy";
import { useScrollRefillProgress } from "@/components/3d/ScrollRefillTransition";
import {
  getBrands,
  getPens,
  calculatePrediction,
  savePredictionToHistory,
} from "@/lib/api";
import type {
  Brand,
  PenModel,
  WritingStyle,
  NotebookType,
  CreatePredictionBody,
  PredictionResponseDto,
} from "@/types";

const PERKS = [
  { icon: Zap, label: "Live 3D slider sync" },
  { icon: Shield, label: "No account needed" },
  { icon: Clock, label: "Save your history" },
];

function getSelectedPageEstimate(
  notebookType: "long_book" | "queen_book" | "king_book" | string,
  estimates: {
    longBook: number;
    queenBook: number;
    kingBook: number;
  }
): number {
  const map: Record<string, number> = {
    long_book: estimates.longBook,
    queen_book: estimates.queenBook,
    king_book: estimates.kingBook,
  };

  return map[notebookType] ?? estimates.queenBook;
}

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [inkLevel, setInkLevel] = useState(65);

  // Catalog & Form State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pens, setPens] = useState<PenModel[]>([]);
  const [loadingPens, setLoadingPens] = useState(false);

  const [selectionMode, setSelectionMode] = useState<"catalog" | "custom">("catalog");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedPenId, setSelectedPenId] = useState<string>("");
  const [customBrand, setCustomBrand] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");

  const [writingStyle, setWritingStyle] = useState<WritingStyle>("normal");
  const [notebookType, setNotebookType] = useState<NotebookType>("queen_book");

  // Execution & Results State
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<PredictionResponseDto | null>(null);
  const [nickname, setNickname] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load brands on mount
  useEffect(() => {
    getBrands().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setBrands(res.data);
        setSelectedBrand(res.data[0].slug);
      }
    });
  }, []);

  // Load pens when selected brand changes
  useEffect(() => {
    if (!selectedBrand) return;
    setLoadingPens(true);
    getPens({ brand: selectedBrand }).then((res) => {
      setLoadingPens(false);
      if (res.success && res.data && res.data.length > 0) {
        setPens(res.data);
        setSelectedPenId(res.data[0].id);
      } else {
        setPens([]);
        setSelectedPenId("");
      }
    });
  }, [selectedBrand]);

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

  const handleCalculate = async () => {
    setErrorMsg(null);
    setSavedSuccess(false);

    // Use exact current slider percentage
    const exactPercentage = Math.min(100, Math.max(0, Math.round(inkLevel)));

    const payload: CreatePredictionBody = {
      inkPercentage: exactPercentage,
      inkRating: exactPercentage / 10,
      writingStyle,
      notebookType,
    };

    if (selectionMode === "catalog") {
      if (!selectedPenId) {
        setErrorMsg("Please select a pen model from the catalog or enter custom details.");
        return;
      }
      payload.penModelId = selectedPenId;
    } else {
      if (!customBrand.trim() || !customModel.trim()) {
        setErrorMsg("Please enter both brand and model name for custom calculation.");
        return;
      }
      payload.enteredBrand = customBrand.trim();
      payload.enteredModel = customModel.trim();
    }

    setCalculating(true);
    try {
      const res = await calculatePrediction(payload);
      if (res.success && res.data) {
        setResult(res.data);
        setNickname(res.data.penName);
      } else {
        setErrorMsg(typeof res.error === "string" ? res.error : "Calculation failed.");
      }
    } catch {
      setErrorMsg("Error communicating with backend service.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const rating = Math.max(0, Math.min(10, Math.round(inkLevel / 10)));
    const req: CreatePredictionBody = {
      penModelId: selectionMode === "catalog" ? selectedPenId : undefined,
      enteredBrand: selectionMode === "custom" ? customBrand : undefined,
      enteredModel: selectionMode === "custom" ? customModel : undefined,
      inkRating: rating,
      writingStyle,
      notebookType,
    };
    savePredictionToHistory(req, result, nickname.trim() || result.penName);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FULL-SCREEN CINEMATIC 3D REFILL LOADER                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showIntro && <InkLifeLoader onComplete={handleIntroComplete} />}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO & LIVE ESTIMATOR STUDIO                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="estimate" className="relative overflow-hidden min-h-[calc(100vh-72px)] transition-colors duration-700">
        {/* Ambient background glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-ink-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-40 w-[500px] h-[500px] bg-ink-mint/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 pb-16 md:pt-10 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            {/* ── Left Column: Headline & Interactive Estimator (7 cols) ── */}
            <motion.div
              initial={{ opacity: 0, x: -35 }}
              animate={!showIntro ? { opacity: 1, x: 0 } : { opacity: 0, x: -35 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left relative z-20 pointer-events-auto space-y-6"
            >
              {/* Badge + Replay button */}
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={!showIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ink-blue/8 border border-ink-blue/15 text-xs font-semibold text-ink-blue tracking-wide uppercase shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Live 3D Mileage Engine
                </motion.div>

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
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={!showIntro ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-navy leading-[1.12]"
                >
                  How many pages{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-ink-blue via-ink-blue-light to-ink-mint bg-clip-text text-transparent">
                      does your pen
                    </span>
                    <motion.span
                      className="absolute bottom-1.5 left-0 w-full h-3 bg-ink-mint/20 rounded -z-0"
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={!showIntro ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    />
                  </span>{" "}
                  have left?
                </motion.h1>

                <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">
                  Drag the 3D refill on the right to set visible ink. Configure your pen below for instant page estimates.
                </p>
              </div>

              {/* ── Live Refill Sync Indicator Chip ── */}
              <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-ink-blue/10 via-ink-mint/10 to-transparent border border-ink-blue/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink-blue animate-pulse" />
                  <span className="text-xs font-bold text-ink-navy">
                    Refill Level: <span className="text-ink-blue">{Math.round(inkLevel)}%</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-ink-blue hidden sm:inline-flex items-center gap-1">
                  ↕ Slide 3D Refill
                </span>
              </div>

              {/* ── Embedded Calculator Studio Form ── */}
              <div className="w-full glass-card rounded-3xl p-5 sm:p-6 shadow-xl border border-white/80 space-y-5 text-left">
                {/* Pen Selection Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-navy">
                      1. Choose Pen Model
                    </span>
                    <div className="flex rounded-lg p-0.5 bg-ink-navy/5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setSelectionMode("catalog")}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          selectionMode === "catalog"
                            ? "bg-white text-ink-blue shadow-xs font-semibold"
                            : "text-ink-muted hover:text-ink-navy"
                        }`}
                      >
                        Catalog
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode("custom")}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          selectionMode === "custom"
                            ? "bg-white text-ink-blue shadow-xs font-semibold"
                            : "text-ink-muted hover:text-ink-navy"
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {selectionMode === "catalog" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">Brand</label>
                        <select
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-ink-border bg-white text-ink-navy text-xs font-medium focus:ring-2 focus:ring-ink-blue/20 outline-none"
                        >
                          {brands.map((b) => (
                            <option key={b.id} value={b.slug}>
                              {b.name} {b.country ? `(${b.country})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">Model</label>
                        <select
                          value={selectedPenId}
                          onChange={(e) => setSelectedPenId(e.target.value)}
                          disabled={loadingPens || pens.length === 0}
                          className="w-full px-3 py-2 rounded-xl border border-ink-border bg-white text-ink-navy text-xs font-medium focus:ring-2 focus:ring-ink-blue/20 outline-none disabled:opacity-50"
                        >
                          {pens.length > 0 ? (
                            pens.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.nominalMileageM ? `(~${p.nominalMileageM}m)` : ""}
                              </option>
                            ))
                          ) : (
                            <option value="">{loadingPens ? "Loading..." : "No models found"}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">Brand Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Pilot, Lamy"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-ink-border bg-white text-ink-navy text-xs font-medium outline-none focus:ring-1 focus:ring-ink-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">Model Name</label>
                        <input
                          type="text"
                          placeholder="e.g. G2 0.7, Safari"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-ink-border bg-white text-ink-navy text-xs font-medium outline-none focus:ring-1 focus:ring-ink-blue"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pressure & Notebook Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Writing Pressure */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-navy mb-2">
                      Writing Pressure
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "light", label: "Light" },
                          { id: "normal", label: "Normal" },
                          { id: "heavy", label: "Heavy" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setWritingStyle(item.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center ${
                            writingStyle === item.id
                              ? "bg-ink-blue text-white shadow-xs"
                              : "bg-white border border-ink-border/60 text-ink-muted hover:text-ink-navy"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notebook Format */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-navy mb-2">
                      Notebook Format
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "queen_book", label: "Queen", sub: "~25 lines" },
                          { id: "long_book", label: "Long", sub: "~30 lines" },
                          { id: "king_book", label: "King", sub: "~20 lines" },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setNotebookType(item.id)}
                          className={`py-1 px-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                            notebookType === item.id
                              ? "bg-ink-mint-dark text-white shadow-xs"
                              : "bg-white border border-ink-border/60 text-ink-muted hover:text-ink-navy"
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[9px] opacity-75">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-ink-blue via-ink-blue-light to-ink-mint shadow-lg shadow-ink-blue/20 hover:shadow-ink-blue/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {calculating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Computing Physical Yield...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Calculate Remaining Pages
                    </>
                  )}
                </button>
              </div>

              {/* ── Calculation Results Section ── */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="w-full glass-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-ink-blue/30 space-y-5 text-left bg-white/80"
                  >
                    <div className="flex items-center justify-between border-b border-ink-border/40 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Calculation Result</span>
                        <h3 className="text-lg font-bold text-ink-navy mt-0.5">{result.penName}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-ink-mint/20 text-ink-navy">
                        <ShieldCheck className="w-3.5 h-3.5 text-ink-mint-dark" />
                        {result.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>

                    {/* Hero Metric */}
                    <div className="text-center py-4 bg-gradient-to-br from-ink-navy/5 to-ink-blue/5 rounded-2xl border border-ink-blue/15">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted">Estimated Pages Remaining</div>
                      <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-ink-blue to-ink-mint bg-clip-text text-transparent my-1">
                        {getSelectedPageEstimate(result.notebookType, result.pageEstimates).toLocaleString()}
                      </div>
                      <div className="text-xs text-ink-muted font-medium">
                        pages in {result.notebookType === "long_book" ? "Long Book" : result.notebookType === "king_book" ? "King Book" : "Queen Book"}
                      </div>
                    </div>

                    {/* 3 Notebook Formats Breakdown */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div
                          className={`p-2 rounded-xl border transition-colors ${
                            result.notebookType === "long_book"
                              ? "bg-ink-mint/15 border-ink-mint/30"
                              : "bg-white border-ink-border/50"
                          }`}
                        >
                          <div
                            className={`text-[10px] ${
                              result.notebookType === "long_book"
                                ? "text-ink-navy font-semibold"
                                : "text-ink-muted font-medium"
                            }`}
                          >
                            Long Book
                          </div>
                          <div className="text-base font-bold text-ink-navy">{result.pageEstimates.longBook} pages</div>
                          <div
                            className={`text-[9px] ${
                              result.notebookType === "long_book" ? "text-ink-navy/70" : "text-ink-muted"
                            }`}
                          >
                            ~30 lines
                          </div>
                        </div>

                        <div
                          className={`p-2 rounded-xl border transition-colors ${
                            result.notebookType === "queen_book"
                              ? "bg-ink-mint/15 border-ink-mint/30"
                              : "bg-white border-ink-border/50"
                          }`}
                        >
                          <div
                            className={`text-[10px] ${
                              result.notebookType === "queen_book"
                                ? "text-ink-navy font-semibold"
                                : "text-ink-muted font-medium"
                            }`}
                          >
                            Queen Book
                          </div>
                          <div className="text-base font-bold text-ink-navy">{result.pageEstimates.queenBook} pages</div>
                          <div
                            className={`text-[9px] ${
                              result.notebookType === "queen_book" ? "text-ink-navy/70" : "text-ink-muted"
                            }`}
                          >
                            ~25 lines
                          </div>
                        </div>

                        <div
                          className={`p-2 rounded-xl border transition-colors ${
                            result.notebookType === "king_book"
                              ? "bg-ink-mint/15 border-ink-mint/30"
                              : "bg-white border-ink-border/50"
                          }`}
                        >
                          <div
                            className={`text-[10px] ${
                              result.notebookType === "king_book"
                                ? "text-ink-navy font-semibold"
                                : "text-ink-muted font-medium"
                            }`}
                          >
                            King Book
                          </div>
                          <div className="text-base font-bold text-ink-navy">{result.pageEstimates.kingBook} pages</div>
                          <div
                            className={`text-[9px] ${
                              result.notebookType === "king_book" ? "text-ink-navy/70" : "text-ink-muted"
                            }`}
                          >
                            ~20 lines
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-ink-muted text-center pt-0.5">
                        Page estimates account for notebook writing space, typical handwriting, and real-world ink use.
                      </p>
                    </div>

                    {/* Physical Writing Length Breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/70">
                        <span className="text-ink-muted">Claimed Total Writing Distance:</span>
                        <span className="font-semibold text-ink-navy">{result.totalWritingLengthMeters.toLocaleString()}m</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/70">
                        <span className="text-ink-muted">Remaining Distance ({result.inkPercentage}%):</span>
                        <span className="font-semibold text-ink-navy">{result.remainingDistanceMeters.toLocaleString()}m</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/70">
                        <div className="flex items-center gap-1.5 group relative">
                          <span className="text-ink-muted">Usable Writing Distance:</span>
                          <span
                            className="inline-flex items-center text-ink-muted/70 hover:text-ink-blue cursor-help"
                            title="Manufacturer writing-distance claims are measured under ideal conditions. InkLife applies a real-world handwriting adjustment."
                          >
                            <Info className="w-3.5 h-3.5" />
                          </span>
                          <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-30 w-64 p-2 rounded-xl bg-ink-navy text-[11px] text-white shadow-xl leading-snug pointer-events-none">
                            Manufacturer writing-distance claims are measured under ideal conditions. InkLife applies a real-world handwriting adjustment.
                          </div>
                        </div>
                        <span className="font-bold text-ink-blue">{result.usableDistanceMeters.toLocaleString()}m</span>
                      </div>
                    </div>

                    {/* Source Citation */}
                    {result.source && (
                      <div className="p-2.5 rounded-xl bg-white/90 border border-ink-border/40 text-xs flex items-center justify-between">
                        <span className="text-ink-muted">Source: {result.source.title}</span>
                        {result.source.url && (
                          <a
                            href={result.source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-blue hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            Verify <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Save to History Row */}
                    <div className="pt-2 border-t border-ink-border/40">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Pen nickname (e.g. Blue Desk Pen)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-ink-border bg-white text-ink-navy font-medium outline-none focus:ring-1 focus:ring-ink-blue"
                        />
                        <button
                          type="button"
                          onClick={handleSave}
                          className="px-4 py-2 rounded-xl bg-ink-navy text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-ink-navy-light transition-colors cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </button>
                      </div>

                      {savedSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-xs font-semibold text-green-600 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Saved! View in your <Link href="/history" className="underline ml-1">Pen History</Link>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Perks row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 justify-center lg:justify-start">
                {PERKS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Icon className="w-3.5 h-3.5 text-ink-mint-dark" />
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Right Column: Interactive 3D Refill Scene Slider (5 cols) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={!showIntro ? { opacity: 1, scale: 1 } : { opacity: 0 }}
              transition={{ delay: 0.25, duration: 0.8 }}
              className="lg:col-span-5 sticky top-20 h-[520px] lg:h-[640px] w-full flex items-center justify-center pointer-events-auto"
            >
              {/* Tooltip badge */}
              {!showIntro && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-4 right-4 z-20 glass-card rounded-xl px-3 py-1.5 text-[11px] font-medium text-ink-navy/80 flex items-center gap-1.5 shadow-sm pointer-events-none"
                >
                  <Move3d className="w-3.5 h-3.5 text-ink-blue" />
                  Drag 3D refill up/down to adjust ink
                </motion.div>
              )}

              {/* 3D Master Scene with interactive refill slider */}
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
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass-card rounded-xl px-4 py-1.5 text-xs font-medium text-ink-navy pointer-events-none flex items-center gap-2 shadow-sm border border-ink-blue/20"
                >
                  <span className="w-2 h-2 rounded-full bg-ink-mint animate-ping" />
                  <span>↕ Drag Refill: <strong className="text-ink-blue">{Math.round(inkLevel)}% ink</strong></span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

