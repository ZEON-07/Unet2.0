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

// ─── Generic API Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
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
