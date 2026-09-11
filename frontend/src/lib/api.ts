import type {
  ApiResponse,
  PenRecord,
  PredictionRequest,
  PredictionResponse,
} from "@/types";
import { mockApi } from "@/lib/mock-api";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: `API error: ${res.status} ${res.statusText}`,
      timestamp: new Date().toISOString(),
    };
  }

  return res.json() as Promise<ApiResponse<T>>;
}

// ─── Fallback helper ─────────────────────────────────────────────────────────

let _mockFallbackActive = false;

export function isMockFallbackActive(): boolean {
  return _mockFallbackActive;
}

async function withFallback<T>(
  realFn: () => Promise<ApiResponse<T>>,
  mockFn: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return mockFn();
  }

  try {
    const result = await realFn();
    _mockFallbackActive = false;
    return result;
  } catch (err) {
    console.warn(
      "[InkLife] API request failed, falling back to mock data:",
      err
    );
    _mockFallbackActive = true;
    return mockFn();
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getPrediction(
  req: PredictionRequest
): Promise<ApiResponse<PredictionResponse>> {
  return withFallback(
    () =>
      apiFetch<PredictionResponse>("/api/predictions", {
        method: "POST",
        body: JSON.stringify(req),
      }),
    () => mockApi.getPrediction(req)
  );
}

export async function getPenRecords(): Promise<ApiResponse<PenRecord[]>> {
  return withFallback(
    () => apiFetch<PenRecord[]>("/api/records"),
    () => mockApi.getPenRecords()
  );
}

export async function getPenRecord(
  id: string
): Promise<ApiResponse<PenRecord | null>> {
  return withFallback(
    () => apiFetch<PenRecord | null>(`/api/records/${id}`),
    () => mockApi.getPenRecord(id)
  );
}

export async function savePenRecord(
  req: PredictionRequest,
  result: PredictionResponse,
  nickname?: string
): Promise<ApiResponse<PenRecord>> {
  return withFallback(
    () =>
      apiFetch<PenRecord>("/api/records", {
        method: "POST",
        body: JSON.stringify({ request: req, result, nickname }),
      }),
    () => mockApi.savePenRecord(req, result, nickname)
  );
}

export async function deletePenRecord(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  return withFallback(
    () =>
      apiFetch<{ deleted: boolean }>(`/api/records/${id}`, {
        method: "DELETE",
      }),
    () => mockApi.deletePenRecord(id)
  );
}
