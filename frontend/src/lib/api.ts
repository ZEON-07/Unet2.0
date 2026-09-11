import type {
  ApiResponse,
  Brand,
  CreatePredictionBody,
  PenModel,
  PenRecord,
  PredictionRequest,
  PredictionResponse,
  PredictionResponseDto,
  SavedPenPrediction,
} from "@/types";
import { mockApi } from "@/lib/mock-api";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        (json && typeof json.error === "object" ? json.error.message : null) ||
        (json && typeof json.error === "string" ? json.error : null) ||
        `API error: ${res.status} ${res.statusText}`;

      return {
        success: false,
        data: null,
        error: errorMsg,
        requestId: json?.requestId,
        timestamp: new Date().toISOString(),
      };
    }

    return json as ApiResponse<T>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      success: false,
      data: null,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── Fallback helper ─────────────────────────────────────────────────────────

let _mockFallbackActive = false;

export function isMockFallbackActive(): boolean {
  return _mockFallbackActive;
}

// ─── Real Backend Endpoints ─────────────────────────────────────────────────

export async function getHealth(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
  return apiFetch<{ status: string; timestamp: string }>("/api/health");
}

export async function getBrands(): Promise<ApiResponse<Brand[]>> {
  const res = await apiFetch<Brand[]>("/api/brands");
  if (!res.success || !res.data) {
    // Fallback seed brands if server is unreachable
    return {
      success: true,
      data: [
        { id: "brand-bic", name: "BIC", slug: "bic", country: "France" },
        { id: "brand-cello", name: "Cello", slug: "cello", country: "India" },
        { id: "brand-flair", name: "Flair", slug: "flair", country: "India" },
        { id: "brand-hauser", name: "Hauser", slug: "hauser", country: "Germany" },
        { id: "brand-lexi", name: "Lexi", slug: "lexi", country: "India" },
        { id: "brand-linc", name: "Linc", slug: "linc", country: "India" },
        { id: "brand-pilot", name: "Pilot", slug: "pilot", country: "Japan" },
        { id: "brand-reynolds", name: "Reynolds", slug: "reynolds", country: "France" },
        { id: "brand-uni", name: "Uni-ball", slug: "uni-ball", country: "Japan" },
        { id: "brand-pentel", name: "Pentel", slug: "pentel", country: "Japan" },
        { id: "brand-zebra", name: "Zebra", slug: "zebra", country: "Japan" },
      ],
      timestamp: new Date().toISOString(),
    };
  }
  return res;
}

export async function getPens(params?: {
  brand?: string;
  search?: string;
  limit?: number;
}): Promise<ApiResponse<PenModel[]>> {
  const searchParams = new URLSearchParams();
  if (params?.brand) searchParams.append("brand", params.brand);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.limit) searchParams.append("limit", params.limit.toString());

  const query = searchParams.toString();
  const res = await apiFetch<any>(`/api/pens${query ? `?${query}` : ""}`);

  if (res.success && Array.isArray(res.data)) {
    const mapped: PenModel[] = res.data.map((pen: any) => ({
      id: pen.id,
      name: pen.name,
      slug: pen.slug,
      flowCategory: pen.flowCategory,
      tipSizeMm: pen.tipSizeMm ?? null,
      nominalMileageM: pen.nominalMileageM ?? null,
      brandId: pen.brand?.id ?? pen.brandId ?? "",
      brandName: pen.brand?.name ?? pen.brandName ?? "",
      brandSlug: pen.brand?.slug ?? pen.brandSlug ?? "",
    }));
    return {
      ...res,
      data: mapped,
    };
  }

  // Fallback known models if offline or backend is unavailable
  const fallbackList: PenModel[] = [
    {
      id: "pen-cello-pinpoint",
      name: "Cello Pinpoint",
      slug: "cello-pinpoint",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.6,
      nominalMileageM: 1500,
      brandId: "brand-cello",
      brandName: "Cello",
      brandSlug: "cello",
    },
    {
      id: "pen-cello-butterflow",
      name: "Cello Butterflow",
      slug: "cello-butterflow",
      flowCategory: "smooth_low_viscosity",
      tipSizeMm: 0.7,
      nominalMileageM: 1200,
      brandId: "brand-cello",
      brandName: "Cello",
      brandSlug: "cello",
    },
    {
      id: "pen-cello-gripper",
      name: "Cello Gripper",
      slug: "cello-gripper",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.5,
      nominalMileageM: 1800,
      brandId: "brand-cello",
      brandName: "Cello",
      brandSlug: "cello",
    },
    {
      id: "pen-lexi-5n",
      name: "Lexi 5N",
      slug: "lexi-5n",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.7,
      nominalMileageM: 2000,
      brandId: "brand-lexi",
      brandName: "Lexi",
      brandSlug: "lexi",
    },
    {
      id: "pen-reynolds-045",
      name: "Reynolds 045 Laser Carbure",
      slug: "reynolds-045-laser-carbure",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 0.7,
      nominalMileageM: 2500,
      brandId: "brand-reynolds",
      brandName: "Reynolds",
      brandSlug: "reynolds",
    },
    {
      id: "pen-reynolds-trimax",
      name: "Reynolds Trimax",
      slug: "reynolds-trimax",
      flowCategory: "liquid_rollerball",
      tipSizeMm: 0.5,
      nominalMileageM: 1500,
      brandId: "brand-reynolds",
      brandName: "Reynolds",
      brandSlug: "reynolds",
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
      id: "pen-bic-cristal",
      name: "BIC Cristal Original",
      slug: "bic-cristal-original",
      flowCategory: "normal_ballpoint",
      tipSizeMm: 1.0,
      nominalMileageM: 3000,
      brandId: "brand-bic",
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
  ];

  let filtered = fallbackList;
  if (params?.brand) {
    const b = params.brand.toLowerCase();
    filtered = filtered.filter(
      (p) => p.brandSlug?.toLowerCase() === b || p.brandName?.toLowerCase() === b || p.brandId.toLowerCase().includes(b)
    );
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s)
    );
  }
  if (params?.limit) {
    filtered = filtered.slice(0, params.limit);
  }

  return {
    success: true,
    data: filtered,
    timestamp: new Date().toISOString(),
  };
}

export async function calculatePrediction(
  body: CreatePredictionBody
): Promise<ApiResponse<PredictionResponseDto>> {
  const res = await apiFetch<PredictionResponseDto>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.success || !res.data) {
    // Graceful offline fallback estimation if backend is not started
    const baseLength = 2000;
    const rawPercentage =
      body.inkPercentage !== undefined
        ? body.inkPercentage
        : body.inkRating !== undefined
        ? body.inkRating * 10
        : 0;
    const safePercentage = Math.min(100, Math.max(0, rawPercentage));

    const remaining = baseLength * (safePercentage / 100);
    const writingStyleFactors = { light: 0.9, normal: 1.0, heavy: 1.2 } as const;
    const styleFactor = writingStyleFactors[body.writingStyle] ?? 1.0;
    const REAL_WORLD_EFFICIENCY = 0.85;

    const usable =
      safePercentage === 0
        ? 0
        : (remaining * REAL_WORLD_EFFICIENCY) / styleFactor;

    const longBook = Math.floor(usable / 7.2);
    const queenBook = Math.floor(usable / 6.0);
    const kingBook = Math.floor(usable / 4.8);

    const pageMap: Record<string, number> = {
      long_book: longBook,
      queen_book: queenBook,
      king_book: kingBook,
    };
    const estimatedPages = pageMap[body.notebookType] ?? queenBook;

    return {
      success: true,
      data: {
        id: `local-calc-${Date.now()}`,
        penName: body.enteredBrand && body.enteredModel ? `${body.enteredBrand} ${body.enteredModel}` : "Standard Pen",
        inkRating: safePercentage / 10,
        inkPercentage: safePercentage,
        totalWritingLengthMeters: baseLength,
        remainingDistanceMeters: Math.round(remaining),
        usableDistanceMeters: Math.round(Math.max(0, usable)),
        estimatedPages,
        pageEstimates: {
          longBook,
          queenBook,
          kingBook,
        },
        flowCategory: "normal_ballpoint",
        writingStyle: body.writingStyle,
        notebookType: body.notebookType,
        confidence: "medium",
        isFallbackEstimate: true,
        fallbackNotes: "Calculated using client fallback model",
        source: null,
        computedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  return res;
}

export async function getPredictionById(
  id: string
): Promise<ApiResponse<PredictionResponseDto>> {
  return apiFetch<PredictionResponseDto>(`/api/predictions/${id}`);
}

export async function searchPenClaims(
  brand: string,
  model: string
): Promise<ApiResponse<{ penModelId?: string; claims: unknown[]; sourceSummary: string }>> {
  return apiFetch("/api/search-lookups", {
    method: "POST",
    body: JSON.stringify({ brand, model }),
  });
}

// ─── Local Storage Pen History ──────────────────────────────────────────────

const HISTORY_KEY = "inklife_saved_pens";

export function getSavedPredictions(): SavedPenPrediction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePredictionToHistory(
  request: CreatePredictionBody,
  result: PredictionResponseDto,
  nickname?: string
): SavedPenPrediction {
  const item: SavedPenPrediction = {
    id: result.id || `pen-${Date.now()}`,
    nickname: nickname || result.penName,
    request,
    result,
    savedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const current = getSavedPredictions();
      const updated = [item, ...current.filter((p) => p.id !== item.id)];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist to localStorage", e);
    }
  }

  return item;
}

export function removePredictionFromHistory(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getSavedPredictions();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

// ─── Backward-compatible Handlers ───────────────────────────────────────────

export async function getPrediction(
  req: PredictionRequest
): Promise<ApiResponse<PredictionResponse>> {
  return mockApi.getPrediction(req);
}

export async function getPenRecords(): Promise<ApiResponse<PenRecord[]>> {
  return mockApi.getPenRecords();
}

export async function getPenRecord(
  id: string
): Promise<ApiResponse<PenRecord | null>> {
  return mockApi.getPenRecord(id);
}

export async function savePenRecord(
  req: PredictionRequest,
  result: PredictionResponse,
  nickname?: string
): Promise<ApiResponse<PenRecord>> {
  return mockApi.savePenRecord(req, result, nickname);
}

export async function deletePenRecord(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return mockApi.deletePenRecord(id);
}

