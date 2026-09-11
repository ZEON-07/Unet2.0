import type {
  ApiResponse,
  PenBrand,
  PenRecord,
  PenType,
  InkColor,
  PredictionRequest,
  PredictionResponse,
  UsageFrequency,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return 300 + Math.random() * 500; // 300–800 ms
}

// ─── Estimation logic (mock) ─────────────────────────────────────────────────

const BASE_PAGES: Record<PenType, number> = {
  ballpoint: 1200,
  gel: 700,
  rollerball: 900,
  fountain_pen: 600,
  felt_tip: 500,
  marker: 400,
  fineliner: 550,
  other: 800,
};

const BRAND_MULTIPLIER: Record<PenBrand, number> = {
  pilot: 1.15,
  uni: 1.12,
  pentel: 1.08,
  zebra: 1.05,
  lamy: 1.2,
  parker: 1.18,
  montblanc: 1.25,
  bic: 0.95,
  sakura: 1.1,
  other: 1.0,
};

const USAGE_ADJUSTMENT: Record<UsageFrequency, number> = {
  light: 1.1,
  moderate: 1.0,
  heavy: 0.85,
  extreme: 0.7,
};

function estimatePages(req: PredictionRequest): PredictionResponse {
  const base = BASE_PAGES[req.penType] ?? 800;
  const brand = BRAND_MULTIPLIER[req.penBrand] ?? 1.0;
  const usage = USAGE_ADJUSTMENT[req.usageFrequency] ?? 1.0;
  const inkMod = req.inkPercentage / 100;

  const estimated = Math.round(base * brand * usage * inkMod);
  const confidence = 0.6 + Math.random() * 0.35; // 0.60 – 0.95

  const recommendations: string[] = [
    "Your pen is looking great — keep writing!",
    "Consider getting a backup pen soon.",
    "Time to start shopping for a refill!",
    "You've still got plenty of pages left.",
    "This pen has seen some love. A refill kit might be wise.",
  ];

  return {
    id: randomId(),
    estimatedPagesRemaining: estimated,
    confidenceScore: Math.round(confidence * 100) / 100,
    breakdown: {
      basePagesEstimate: base,
      brandMultiplier: brand,
      usageAdjustment: usage,
      inkTypeModifier: inkMod,
    },
    recommendation:
      recommendations[Math.floor(Math.random() * recommendations.length)],
    createdAt: new Date().toISOString(),
  };
}

// ─── In-memory store ─────────────────────────────────────────────────────────

const store: PenRecord[] = [
  {
    id: "demo-1",
    nickname: "Trusty Blue Pilot",
    request: {
      penBrand: "pilot" as PenBrand,
      penType: "gel" as PenType,
      inkColor: "blue" as InkColor,
      inkPercentage: 42,
      usageFrequency: "moderate" as UsageFrequency,
    },
    result: estimatePages({
      penBrand: "pilot" as PenBrand,
      penType: "gel" as PenType,
      inkColor: "blue" as InkColor,
      inkPercentage: 42,
      usageFrequency: "moderate" as UsageFrequency,
    }),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-2",
    nickname: "Office Workhorse",
    request: {
      penBrand: "bic" as PenBrand,
      penType: "ballpoint" as PenType,
      inkColor: "black" as InkColor,
      inkPercentage: 78,
      usageFrequency: "heavy" as UsageFrequency,
    },
    result: estimatePages({
      penBrand: "bic" as PenBrand,
      penType: "ballpoint" as PenType,
      inkColor: "black" as InkColor,
      inkPercentage: 78,
      usageFrequency: "heavy" as UsageFrequency,
    }),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

// ─── Mock API ────────────────────────────────────────────────────────────────

function wrapResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

export const mockApi = {
  async getPrediction(
    req: PredictionRequest
  ): Promise<ApiResponse<PredictionResponse>> {
    await sleep(randomLatency());
    const result = estimatePages(req);
    return wrapResponse(result);
  },

  async getPenRecords(): Promise<ApiResponse<PenRecord[]>> {
    await sleep(randomLatency());
    return wrapResponse([...store]);
  },

  async getPenRecord(id: string): Promise<ApiResponse<PenRecord | null>> {
    await sleep(randomLatency());
    const record = store.find((r) => r.id === id) ?? null;
    if (!record) {
      return {
        success: false,
        data: null,
        error: `Record with id "${id}" not found`,
        timestamp: new Date().toISOString(),
      };
    }
    return wrapResponse(record);
  },

  async savePenRecord(
    req: PredictionRequest,
    result: PredictionResponse,
    nickname?: string
  ): Promise<ApiResponse<PenRecord>> {
    await sleep(randomLatency());
    const record: PenRecord = {
      id: randomId(),
      request: req,
      result,
      nickname,
      createdAt: new Date().toISOString(),
    };
    store.push(record);
    return wrapResponse(record);
  },

  async deletePenRecord(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    await sleep(randomLatency());
    const idx = store.findIndex((r) => r.id === id);
    if (idx === -1) {
      return {
        success: false,
        data: null,
        error: `Record with id "${id}" not found`,
        timestamp: new Date().toISOString(),
      };
    }
    store.splice(idx, 1);
    return wrapResponse({ deleted: true });
  },
};
