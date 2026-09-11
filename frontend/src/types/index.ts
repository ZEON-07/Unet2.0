// ─── Enums ───────────────────────────────────────────────────────────────────

export enum PenBrand {
  Pilot = "pilot",
  Uni = "uni",
  Pentel = "pentel",
  Zebra = "zebra",
  Lamy = "lamy",
  Parker = "parker",
  Montblanc = "montblanc",
  Bic = "bic",
  Sakura = "sakura",
  Other = "other",
}

export enum InkColor {
  Black = "black",
  Blue = "blue",
  Red = "red",
  Green = "green",
  Purple = "purple",
  Orange = "orange",
  Brown = "brown",
  Pink = "pink",
  Other = "other",
}

export enum PenType {
  Ballpoint = "ballpoint",
  Gel = "gel",
  Rollerball = "rollerball",
  FountainPen = "fountain_pen",
  FeltTip = "felt_tip",
  Marker = "marker",
  Fineliner = "fineliner",
  Other = "other",
}

export enum UsageFrequency {
  Light = "light",
  Moderate = "moderate",
  Heavy = "heavy",
  Extreme = "extreme",
}

// ─── API Request / Response ──────────────────────────────────────────────────

export interface PredictionRequest {
  penBrand: PenBrand;
  penType: PenType;
  inkColor: InkColor;
  inkPercentage: number; // 0–100
  usageFrequency: UsageFrequency;
  penModel?: string;
  notes?: string;
}

export interface PredictionBreakdown {
  basePagesEstimate: number;
  brandMultiplier: number;
  usageAdjustment: number;
  inkTypeModifier: number;
}

export interface PredictionResponse {
  id: string;
  estimatedPagesRemaining: number;
  confidenceScore: number; // 0–1
  breakdown: PredictionBreakdown;
  recommendation: string;
  createdAt: string; // ISO 8601
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface PenRecord {
  id: string;
  request: PredictionRequest;
  result: PredictionResponse;
  createdAt: string; // ISO 8601
  nickname?: string;
}

// ─── Backend API Types ───────────────────────────────────────────────────────

export type WritingStyle = "light" | "normal" | "heavy";
export type NotebookType = "long_book" | "queen_book" | "king_book";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  createdAt?: string;
}

export interface PenModel {
  id: string;
  name: string;
  slug: string;
  flowCategory: string;
  tipSizeMm: number | null;
  nominalMileageM: number | null;
  brandId: string;
  brandName?: string;
  brandSlug?: string;
}

export interface CreatePredictionBody {
  penModelId?: string;
  enteredBrand?: string;
  enteredModel?: string;
  inkPercentage?: number; // 0-100 exact slider percentage
  inkRating?: number; // 0-10 legacy
  writingStyle: WritingStyle;
  notebookType: NotebookType;
}

export interface PredictionSource {
  title: string;
  url: string | null;
  checkedAt: string;
}

export interface PredictionResponseDto {
  id: string;
  penName: string;
  inkRating: number;
  inkPercentage: number;
  totalWritingLengthMeters: number;
  remainingDistanceMeters: number;
  usableDistanceMeters: number;
  estimatedPages: number;
  pageEstimates: {
    longBook: number;
    queenBook: number;
    kingBook: number;
  };
  flowCategory: string;
  writingStyle: string;
  notebookType: string;
  confidence: "low" | "medium" | "high" | "very_high";
  isFallbackEstimate: boolean;
  fallbackNotes: string | null;
  source: PredictionSource | null;
  computedAt: string;
}

export interface SavedPenPrediction {
  id: string;
  nickname: string;
  request: CreatePredictionBody;
  result: PredictionResponseDto;
  savedAt: string;
}

// ─── Generic API Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  } | string | null;
  requestId?: string;
  timestamp?: string;
}

// ─── Mock Config ─────────────────────────────────────────────────────────────

export interface MockConfig {
  enabled: boolean;
  latencyMs: [number, number]; // [min, max]
  failureRate: number; // 0–1 probability of simulated failure
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  icon?: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  gradient: string;
}
