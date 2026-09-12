"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Info,
  ShieldCheck,
  ExternalLink,
  Ruler,
  Droplet,
  ArrowRight,
  ArrowDownRight,
  Compass,
  RefreshCw,
  Layers,
  Sliders,
  MoveVertical,
  Zap,
} from "lucide-react";
import { getBrands, getPens, calculatePrediction } from "@/lib/api";
import type {
  Brand,
  PenModel,
  CreatePredictionBody,
  PredictionResponseDto,
  WritingStyle,
  NotebookType,
} from "@/types";
import { RefillCanvas } from "@/components/three/RefillCanvas";
import { InkLifeLoader } from "@/components/3d/InkLifeLoader";
import { useInkMode } from "@/components/providers/InkModeProvider";
import { SpecimenSideDrawer } from "@/components/ui/SpecimenSideDrawer";

function getSelectedPageEstimate(
  notebookType: NotebookType | string,
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
  const { mode } = useInkMode();
  const isDark = mode === "dark";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Specimen Drawer State
  const [selectedSpecimen, setSelectedSpecimen] = useState<PenModel | null>(null);

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);

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

  // Track global scroll
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / docHeight)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isMobile = useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth < 768,
    () => false
  );

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const replayIntro = () => {
    setInkLevel(65);
    setShowIntro(true);
  };

  const handleCalculate = async () => {
    setErrorMsg(null);

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

        // Smooth scroll to result section
        setTimeout(() => {
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        setErrorMsg(typeof res.error === "string" ? res.error : "Calculation failed.");
      }
    } catch {
      setErrorMsg("Error communicating with backend service.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSelectSpecimen = (pen: PenModel) => {
    setSelectionMode("catalog");
    if (pen.brandSlug) {
      setSelectedBrand(pen.brandSlug);
    }
    setSelectedPenId(pen.id);
    document.getElementById("estimate")?.scrollIntoView({ behavior: "smooth" });
  };

  // Specimen gallery list
  const specimens: PenModel[] = [
    {
      id: "01919000-0000-7000-8000-000000000010",
      name: "BIC Cristal Original",
      slug: "bic-cristal-original",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 1.0,
      nominalMileageM: 3000,
      brandId: "01919000-0000-7000-8000-000000000001",
      brandName: "BIC",
      brandSlug: "bic",
    },
    {
      id: "pen-flair-writometer",
      name: "Flair Writo-meter",
      slug: "flair-writometer",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.7,
      nominalMileageM: 10000,
      brandId: "brand-flair",
      brandName: "Flair",
      brandSlug: "flair",
    },
    {
      id: "pen-hauser-xo",
      name: "Hauser XO",
      slug: "hauser-xo",
      flowCategory: "smooth_low_viscosity",
      tipSizeMm: 0.6,
      nominalMileageM: 1500,
      brandId: "brand-hauser",
      brandName: "Hauser",
      brandSlug: "hauser",
    },
    {
      id: "pen-linc-pentonic",
      name: "Linc Pentonic",
      slug: "linc-pentonic",
      flowCategory: "smooth_low_viscosity",
      tipSizeMm: 0.7,
      nominalMileageM: 1500,
      brandId: "brand-linc",
      brandName: "Linc",
      brandSlug: "linc",
    },
    {
      id: "pen-pilot-v5",
      name: "Pilot V5 Hi-Tecpoint",
      slug: "pilot-v5-hi-tecpoint",
      flowCategory: "liquid_rollerball",
      tipSizeMm: 0.5,
      nominalMileageM: 1800,
      brandId: "brand-pilot",
      brandName: "Pilot",
      brandSlug: "pilot",
    },
    {
      id: "pen-pilot-g2",
      name: "Pilot G2 0.7",
      slug: "pilot-g2-07",
      flowCategory: "gel",
      tipSizeMm: 0.7,
      nominalMileageM: 1200,
      brandId: "brand-pilot",
      brandName: "Pilot",
      brandSlug: "pilot",
    },
    {
      id: "pen-cello-pinpoint",
      name: "Cello Pinpoint",
      slug: "cello-pinpoint",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.6,
      nominalMileageM: 2000,
      brandId: "brand-cello",
      brandName: "Cello",
      brandSlug: "cello",
    },
    {
      id: "pen-reynolds-045",
      name: "Reynolds 045 Classic",
      slug: "reynolds-045-classic",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.7,
      nominalMileageM: 1500,
      brandId: "brand-reynolds",
      brandName: "Reynolds",
      brandSlug: "reynolds",
    },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  00. OPENING FULL-SCREEN LABORATORY LOADER                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showIntro && <InkLifeLoader onComplete={handleIntroComplete} />}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  01. SECTION 01 — ASYMMETRIC SWISS EDITORIAL HERO                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] border-b border-[var(--line)] flex flex-col justify-between px-4 sm:px-8 pt-4 pb-4">
        {/* Background Grid Crosses */}
        <div className="absolute top-12 left-12 tech-cross" />
        <div className="absolute top-12 right-12 tech-cross" />
        <div className="absolute bottom-12 left-12 tech-cross" />
        <div className="absolute bottom-12 right-12 tech-cross" />

        {/* Top Identification Bar */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-widest uppercase text-[var(--muted)] border-b border-[var(--line)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ink-blue)] animate-pulse" />
            <span className="text-[var(--foreground)] font-bold">INK ANALYSIS SYSTEM</span>
            <span>/ REF. 2.1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span>MODEL: BIC CRISTAL BENCHMARK</span>
            <span>VISIBLE REFILL DETECTION</span>
            <button
              type="button"
              onClick={replayIntro}
              className="text-[var(--ink-blue)] hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className="w-2.5 h-2.5" /> REPLAY CALIBRATION
            </button>
          </div>
        </div>

        {/* Main Hero Grid: Left Typography, Center 3D Refill with Technical Leaders */}
        <div className="relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-2">
          {/* Left Column (6 cols): Massive Grotesque Typography */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--muted)] mb-2">
              [ ESTIMATION MODULE 01 ]
            </span>

            <h1 className="text-4xl sm:text-6xl lg:text-[80px] xl:text-[90px] font-black uppercase tracking-tighter leading-[0.88] text-[var(--foreground)]">
              HOW MUCH<br />
              LIFE IS LEFT<br />
              IN YOUR{" "}
              <span className="text-[var(--ink-blue)] underline decoration-[var(--line)] decoration-2 underline-offset-8">
                INK?
              </span>
            </h1>

            <div className="mt-4 max-w-md space-y-0.5 text-xs sm:text-sm text-[var(--muted)] font-mono leading-relaxed">
              <p>A question nobody asked.</p>
              <p className="text-[var(--foreground)] font-medium">
                An estimate every transparent pen deserves.
              </p>
            </div>

            {/* Telemetry Panel */}
            <div className="mt-5 grid grid-cols-3 gap-3 border border-[var(--line)] bg-[var(--surface)] p-3 max-w-lg font-mono text-[10px]">
              <div>
                <div className="text-[var(--muted)] uppercase">SYSTEM</div>
                <div className="font-bold text-[var(--foreground)] mt-0.5">INKLIFE 01</div>
              </div>
              <div className="border-l border-[var(--line)] pl-3">
                <div className="text-[var(--muted)] uppercase">INPUT</div>
                <div className="font-bold text-[var(--ink-blue)] mt-0.5">
                  {Math.round(inkLevel)}% VISIBLE
                </div>
              </div>
              <div className="border-l border-[var(--line)] pl-3">
                <div className="text-[var(--muted)] uppercase">OUTPUT</div>
                <div className="font-bold text-[var(--foreground)] mt-0.5">PAGE CAPACITY</div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/#estimate"
                className="px-5 py-3 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--ink-blue)] hover:text-white transition-all text-xs font-mono font-bold tracking-widest uppercase shadow-sm flex items-center gap-2"
              >
                CONFIGURE SAMPLE <ArrowDownRight className="w-4 h-4" />
              </Link>

              <Link
                href="/#methodology"
                className="px-4 py-3 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-all text-xs font-mono font-bold tracking-widest uppercase"
              >
                VIEW METHOD
              </Link>
            </div>
          </div>

          {/* Right Column (6 cols): Central Interactive 3D Refill with Technical Annotations */}
          <div className="lg:col-span-6 relative h-[440px] w-full flex items-center justify-center">
            {/* 3D Scene */}
            <div className="absolute inset-0 z-10">
              <RefillCanvas
                mode="hero"
                inkPercentage={inkLevel}
                onInkChange={setInkLevel}
                scrollProgress={isMobile ? 0 : scrollProgress}
                isDarkAnalysisMode={isDark}
              />
            </div>

            {/* Technical Annotation Leader Lines (Overlay) */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 sm:p-4 font-mono text-[9px] sm:text-[10px] text-[var(--muted)] select-none">
              {/* Top Right Callout */}
              <div className="self-end flex items-center gap-2 mt-1">
                <div className="p-1.5 border border-[var(--line)] bg-[var(--surface)] shadow-xs">
                  <div className="font-bold text-[var(--foreground)]">VISIBLE INK COLUMN</div>
                  <div>USER-CONTROLLED LEVEL: {Math.round(inkLevel)}%</div>
                </div>
                <div className="tech-anchor-box" />
              </div>

              {/* Middle Left Callout */}
              <div className="self-start flex items-center gap-2">
                <div className="tech-anchor-box" />
                <div className="p-1.5 border border-[var(--line)] bg-[var(--surface)] shadow-xs">
                  <div className="font-bold text-[var(--foreground)]">BALLPOINT DELIVERY</div>
                  <div>TUNGSTEN CARBIDE NATIVE FLOW</div>
                </div>
              </div>

              {/* Bottom Right Callout */}
              <div className="self-end flex items-center gap-2 mb-2">
                <div className="p-1.5 border border-[var(--line)] bg-[var(--surface)] shadow-xs">
                  <div className="font-bold text-[var(--foreground)]">DRAG REFILL / SET LEVEL</div>
                  <div className="text-[var(--ink-blue)] font-bold">↕ VERTICAL SLIDER SYNC</div>
                </div>
                <div className="tech-anchor-box" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section Marker */}
        <div className="relative z-20 flex items-center justify-between font-mono text-[9px] text-[var(--muted)] tracking-widest pt-4 border-t border-[var(--line)]">
          <span>01 / 05 // SYSTEM BENCHMARK</span>
          <span>SCROLL FOR LABORATORY CALCULATION →</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  02. SECTION 02 — LABORATORY CALCULATOR: CONFIGURE THE SAMPLE       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="estimate" className="relative border-b border-[var(--line)] py-16 sm:py-24 px-4 sm:px-8 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Section Heading in Swiss Editorial Layout */}
          <div className="border-b border-[var(--line)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] block mb-1">
                [ STAGE 01 / SAMPLING BENCH ]
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tighter text-[var(--foreground)]">
                01. CONFIGURE<br />THE SAMPLE
              </h2>
            </div>
            <div className="font-mono text-xs text-[var(--muted)] max-w-xs text-left sm:text-right">
              Precision pen parameter configuration. Claims are normalized through physical efficiency coefficients.
            </div>
          </div>

          {/* Laboratory Control Bench: 3 Columns with Hairline Borders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 border border-[var(--line)] divide-y lg:divide-y-0 lg:divide-x divide-[var(--line)] bg-[var(--background)]/40 font-mono">
            {/* ── Column 1: Brand & Model Selection ── */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  PEN MODEL
                </span>
                <div className="flex border border-[var(--line)] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectionMode("catalog")}
                    className={`px-3 py-1 transition-all ${
                      selectionMode === "catalog"
                        ? "bg-[var(--foreground)] text-[var(--background)] font-bold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    CATALOG
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode("custom")}
                    className={`px-3 py-1 transition-all ${
                      selectionMode === "custom"
                        ? "bg-[var(--foreground)] text-[var(--background)] font-bold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    CUSTOM
                  </button>
                </div>
              </div>

              {selectionMode === "catalog" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      1. SELECT BRAND
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-mono outline-none focus:border-[var(--ink-blue)]"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.slug}>
                          {b.name} {b.country ? `[${b.country}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      2. SELECT MODEL
                    </label>
                    <select
                      value={selectedPenId}
                      onChange={(e) => setSelectedPenId(e.target.value)}
                      disabled={loadingPens || pens.length === 0}
                      className="w-full px-3 py-2.5 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-mono outline-none focus:border-[var(--ink-blue)] disabled:opacity-50"
                    >
                      {pens.length > 0 ? (
                        pens.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.nominalMileageM ? `(~${p.nominalMileageM}m)` : ""}
                          </option>
                        ))
                      ) : (
                        <option value="">{loadingPens ? "SCANNING..." : "NO MODELS FOUND"}</option>
                      )}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      BRAND NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PILOT, LAMY"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-mono outline-none focus:border-[var(--ink-blue)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                      MODEL NAME
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. G2 0.7, SAFARI"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-mono outline-none focus:border-[var(--ink-blue)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Column 2: Exact Ink Percentage Slider & Gauge ── */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  VISIBLE INK LEVEL
                </span>
                <span className="text-sm font-bold text-[var(--ink-blue)]">
                  {Math.round(inkLevel)}%
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2 flex justify-between">
                  <span>SCALE: 0% → 100%</span>
                  <span className="text-[var(--foreground)]">EXACT VALUE: {Math.round(inkLevel)}</span>
                </label>

                {/* Precision Slider Bar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={inkLevel}
                  onChange={(e) => setInkLevel(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--line)] accent-[var(--ink-blue)] cursor-pointer"
                />

                {/* Millimeter Ticks */}
                <div className="flex justify-between text-[8px] text-[var(--muted)] pt-1.5">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Visual Tube Fill Gauge */}
              <div className="p-3 border border-[var(--line)] bg-[var(--surface)] flex items-center justify-between text-xs">
                <span className="text-[10px] text-[var(--muted)] uppercase">REFILL MENISCUS:</span>
                <span className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--ink-blue)]" />
                  {Math.round(inkLevel)}% DETECTED
                </span>
              </div>
            </div>

            {/* ── Column 3: Pressure & Notebook Configuration ── */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  CONDITIONS
                </span>
              </div>

              {/* Writing Pressure */}
              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2">
                  WRITING PRESSURE
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(
                    [
                      { id: "light", label: "LIGHT", factor: "0.9×" },
                      { id: "normal", label: "NORMAL", factor: "1.0×" },
                      { id: "heavy", label: "HEAVY", factor: "1.2×" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWritingStyle(item.id)}
                      className={`p-2 border text-center transition-all ${
                        writingStyle === item.id
                          ? "border-[var(--ink-blue)] bg-[var(--ink-blue)] text-white font-bold"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[9px] opacity-70">{item.factor}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notebook Format */}
              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase tracking-wider mb-2">
                  NOTEBOOK FORMAT
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(
                    [
                      { id: "queen_book", label: "QUEEN", sub: "25 LINES" },
                      { id: "long_book", label: "LONG", sub: "30 LINES" },
                      { id: "king_book", label: "KING", sub: "20 LINES" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNotebookType(item.id)}
                      className={`p-2 border text-center transition-all ${
                        notebookType === item.id
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-bold"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <div>{item.label}</div>
                      <div className="text-[8px] opacity-70">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 border border-red-500 bg-red-50 text-red-800 font-mono text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button: Rectangular Electric Blue Button */}
          <button
            type="button"
            onClick={handleCalculate}
            disabled={calculating}
            className="w-full py-4 px-6 bg-[var(--ink-blue)] hover:bg-[var(--foreground)] text-white font-mono text-sm font-bold tracking-widest uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {calculating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>COMPUTING PHYSICAL ESTIMATE...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>RUN INK ESTIMATION →</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  03. SECTION 03 — CALCULATION RESULT: INK SURVIVAL PROJECTION       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {result && (
          <motion.section
            id="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative border-b border-[var(--line)] py-16 sm:py-24 px-4 sm:px-8 bg-[var(--background)]"
          >
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Section Header */}
              <div className="border-b border-[var(--line)] pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)]">
                    [ STAGE 02 / ESTIMATION RESULT ]
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tighter text-[var(--foreground)]">
                    02. INK SURVIVAL PROJECTION
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs border border-[var(--line)] px-3 py-1.5 bg-[var(--surface)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--ink-blue)]" />
                  <span>{result.confidence.toUpperCase()} CONFIDENCE</span>
                </div>
              </div>

              {/* Large Metric Display & Spec Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Massive Primary Readout (7 cols) */}
                <div className="lg:col-span-7 border border-[var(--line)] bg-[var(--surface)] p-8 sm:p-12 text-left space-y-6">
                  <div className="font-mono text-xs text-[var(--muted)] tracking-widest uppercase">
                    SPECIMEN: {result.penName}
                  </div>

                  <div className="space-y-1">
                    <div className="text-7xl sm:text-9xl font-black tracking-tighter text-[var(--foreground)] leading-none font-sans">
                      {getSelectedPageEstimate(result.notebookType, result.pageEstimates).toLocaleString()}
                    </div>
                    <div className="text-base sm:text-xl font-mono font-bold tracking-tight text-[var(--ink-blue)] uppercase">
                      PAGES REMAINING
                    </div>
                    <div className="text-xs font-mono text-[var(--muted)]">
                      IN {result.notebookType === "long_book" ? "LONG BOOK (30 LINES)" : result.notebookType === "king_book" ? "KING BOOK (20 LINES)" : "QUEEN BOOK (25 LINES)"}
                    </div>
                  </div>

                  {/* 3 Notebook Formats Comparison Table with Hairlines */}
                  <div className="border-t border-[var(--line)] pt-6 space-y-2">
                    <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] mb-3">
                      CROSS-FORMAT COMPARISON
                    </div>

                    <div className="border border-[var(--line)] divide-y divide-[var(--line)] font-mono text-xs">
                      <div className={`p-3 flex justify-between items-center ${result.notebookType === "long_book" ? "bg-[var(--ink-blue)]/10 font-bold text-[var(--ink-blue)]" : ""}`}>
                        <span>LONG BOOK (~30 LINES)</span>
                        <span>{result.pageEstimates.longBook} PAGES</span>
                      </div>
                      <div className={`p-3 flex justify-between items-center ${result.notebookType === "queen_book" ? "bg-[var(--ink-blue)]/10 font-bold text-[var(--ink-blue)]" : ""}`}>
                        <span>QUEEN BOOK (~25 LINES)</span>
                        <span>{result.pageEstimates.queenBook} PAGES</span>
                      </div>
                      <div className={`p-3 flex justify-between items-center ${result.notebookType === "king_book" ? "bg-[var(--ink-blue)]/10 font-bold text-[var(--ink-blue)]" : ""}`}>
                        <span>KING BOOK (~20 LINES)</span>
                        <span>{result.pageEstimates.kingBook} PAGES</span>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-[var(--muted)] pt-2">
                      Page estimates account for notebook writing space, typical handwriting, and real-world ink use.
                    </p>
                  </div>
                </div>

                {/* Right Column (5 cols): Parameter Telemetry Grid */}
                <div className="lg:col-span-5 space-y-4 font-mono text-xs">
                  <div className="border border-[var(--line)] bg-[var(--surface)] p-6 space-y-3.5">
                    <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] border-b border-[var(--line)] pb-2 font-bold">
                      CALCULATION PARAMETERS
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--muted)]">Claimed Total Writing Distance:</span>
                      <span className="font-bold text-[var(--foreground)]">{result.totalWritingLengthMeters.toLocaleString()}m</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--muted)]">Remaining Distance ({result.inkPercentage}%):</span>
                      <span className="font-bold text-[var(--foreground)]">{result.remainingDistanceMeters.toLocaleString()}m</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-t border-[var(--line)] pt-2">
                      <div className="flex items-center gap-1.5 group relative">
                        <span className="text-[var(--muted)]">Usable Writing Distance:</span>
                        <span
                          className="text-[var(--ink-blue)] cursor-help"
                          title="Manufacturer writing-distance claims are measured under ideal conditions. InkLife applies a real-world handwriting adjustment."
                        >
                          <Info className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <span className="font-extrabold text-[var(--ink-blue)] text-sm">{result.usableDistanceMeters.toLocaleString()}m</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--muted)]">Writing Pressure:</span>
                      <span className="font-bold text-[var(--foreground)] uppercase">{result.writingStyle}</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--muted)]">Confidence:</span>
                      <span className="font-bold text-[var(--foreground)] uppercase">{result.confidence}</span>
                    </div>
                  </div>

                  {/* Public Claim Source Annotation */}
                  {result.source && (
                    <div className="border border-[var(--line)] bg-[var(--surface)] p-4 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-[var(--muted)] uppercase">SOURCE 01</div>
                        <div className="font-bold text-[var(--foreground)]">{result.source.title}</div>
                      </div>
                      {result.source.url && (
                        <a
                          href={result.source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 border border-[var(--foreground)] text-[10px] font-bold uppercase hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all inline-flex items-center gap-1"
                        >
                          VERIFY EXTERNAL <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  03. SECTION 03 — SUPPORTED INK SYSTEMS: FLOATING SPECIMEN GALLERY   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="specimens" className="relative border-b border-[var(--line)] py-16 sm:py-24 px-4 sm:px-8 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="border-b border-[var(--line)] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--muted)] block mb-1">
                [ STAGE 03 / SPECIMEN REPOSITORY ]
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tighter text-[var(--foreground)]">
                03. SUPPORTED<br />INK SYSTEMS
              </h2>
            </div>
            <div className="font-mono text-xs text-[var(--muted)]">
              Click any specimen to inspect physical metrics or load directly into the estimator.
            </div>
          </div>

          {/* Floating Specimen Index Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {specimens.map((specimen, idx) => (
              <div
                key={specimen.id}
                onClick={() => setSelectedSpecimen(specimen)}
                className="group border border-[var(--line)] bg-[var(--surface)] p-5 hover:border-[var(--ink-blue)] transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-xs"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px] text-[var(--muted)] border-b border-[var(--line)] pb-2 mb-3">
                    <span>{`0${idx + 1}.`}</span>
                    <span className="uppercase">{specimen.brandName}</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] group-hover:text-[var(--ink-blue)] transition-colors">
                    {specimen.name}
                  </h3>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {specimen.nominalMileageM ? `${specimen.nominalMileageM.toLocaleString()}M CLAIM` : "CUSTOM"}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex justify-between items-center text-[10px] text-[var(--muted)]">
                  <span>{specimen.flowCategory.replace("_", " ").toUpperCase()}</span>
                  <span className="group-hover:text-[var(--ink-blue)] transition-colors font-bold">
                    INSPECT →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specimen Side Drawer (for inspecting individual pens) ── */}
      <SpecimenSideDrawer
        pen={selectedSpecimen}
        onClose={() => setSelectedSpecimen(null)}
        onSelectForEstimate={handleSelectSpecimen}
      />
    </>
  );
}
