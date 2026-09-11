/**
 * End-to-End Live Verification Script for InkLife API
 *
 * Tests all core routes against a running local worker (http://localhost:8787).
 *
 * Run with:  npx tsx src/tests/e2e.verify.ts
 */

const BASE_URL = "http://localhost:8787";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    const msg = `❌ FAIL: ${message}`;
    console.error(`  ${msg}`);
    failures.push(msg);
    failed++;
  } else {
    console.log(`  ✅ ${message}`);
    passed++;
  }
}

async function request(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    token?: string;
  } = {}
) {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const json: any = await res.json().catch(() => null);
  return { status: res.status, json, headers: res.headers };
}

async function runE2E() {
  console.log("\n============================================================");
  console.log("InkLife API – End-to-End Production Verification");
  console.log(`Target: ${BASE_URL}`);
  console.log("============================================================\n");

  // 1. Health check
  console.log("📋 1. Service Health & Connectivity");
  const health = await request("/api/health");
  assert(health.status === 200, "GET /api/health returns 200");
  assert(health.json?.data?.status === "ok", "Service status is ok");
  assert(health.json?.data?.services?.database?.status === "ok", "D1 database connection is ok");

  // 2. OpenAPI Documentation
  console.log("\n📋 2. Documentation Endpoints");
  const openApi = await request("/api/docs/openapi.json");
  assert(openApi.status === 200, "GET /api/docs/openapi.json returns 200");
  assert(openApi.json?.openapi === "3.1.0", "OpenAPI version is 3.1.0");
  assert(openApi.json?.info?.title === "InkLife API", "OpenAPI title matches");

  // 3. Brands
  console.log("\n📋 3. Brands Directory");
  const brands = await request("/api/brands");
  assert(brands.status === 200, "GET /api/brands returns 200");
  assert(Array.isArray(brands.json?.data), "Brands data is an array");
  const bicBrand = brands.json?.data?.find((b: { slug: string }) => b.slug === "bic");
  assert(bicBrand !== undefined, "Found seeded brand 'bic'");

  // 4. Pens search and detail with claims
  console.log("\n📋 4. Pen Catalog & Verified Claims");
  const pens = await request("/api/pens/search?limit=10");
  assert(pens.status === 200, "GET /api/pens/search returns 200");
  assert(pens.json?.data?.length >= 3, "Catalog contains all seeded pens");

  const penDetail = await request("/api/pens/bic-cristal-original");
  assert(penDetail.status === 200, "GET /api/pens/bic-cristal-original returns 200");
  assert(penDetail.json?.data?.name === "Cristal Original", "Pen detail matches Cristal Original");
  assert(
    Array.isArray(penDetail.json?.data?.claims) && penDetail.json.data.claims.length > 0,
    "Pen detail contains linked active claims"
  );
  assert(
    penDetail.json?.data?.claims[0]?.sourceName === "BIC Official",
    "First claim is linked to 'BIC Official' source"
  );

  // 5. Predictions: Seeded Pens
  console.log("\n📋 5. Prediction Engine (Seeded Pens)");

  // 5a. BIC Cristal Original (3,000m nominal)
  const bicPred = await request("/api/predictions", {
    method: "POST",
    body: {
      penModelId: "01919000-0000-7000-8000-000000000010",
      inkRating: 8,
      writingStyle: "normal",
      notebookType: "queen_book",
    },
  });
  assert(bicPred.status === 201, "POST /api/predictions for BIC Cristal returns 201");
  assert(bicPred.json?.data?.totalWritingLengthMeters === 3000, "BIC Cristal writing length = 3,000m");
  assert(bicPred.json?.data?.remainingDistanceMeters === 2400, "BIC Cristal remaining = 2,400m at ink=8");
  assert(bicPred.json?.data?.usableDistanceMeters === 2400, "BIC Cristal usable = 2,400m (flowFactor=1.0)");
  assert(bicPred.json?.data?.estimatedPages === 600, "BIC Cristal queen book pages = 600");
  assert(bicPred.json?.data?.source?.title === "BIC Official", "BIC prediction links real source title");

  // 5b. Flair Writo-meter (10,000m nominal)
  const flairPred = await request("/api/predictions", {
    method: "POST",
    body: {
      penModelId: "01919000-0000-7000-8000-000000000011",
      inkRating: 5,
      writingStyle: "light",
      notebookType: "king_book",
    },
  });
  assert(flairPred.status === 201, "POST /api/predictions for Flair Writo-meter returns 201");
  assert(flairPred.json?.data?.totalWritingLengthMeters === 10000, "Flair writing length = 10,000m");
  assert(flairPred.json?.data?.remainingDistanceMeters === 5000, "Flair remaining = 5,000m at ink=5");

  // 5c. Hauser XO (1,500m nominal)
  const hauserPred = await request("/api/predictions", {
    method: "POST",
    body: {
      penModelId: "01919000-0000-7000-8000-000000000012",
      inkRating: 10,
      writingStyle: "heavy",
      notebookType: "long_book",
    },
  });
  assert(hauserPred.status === 201, "POST /api/predictions for Hauser XO returns 201");
  assert(hauserPred.json?.data?.totalWritingLengthMeters === 1500, "Hauser XO writing length = 1,500m");

  // 5d. Fallback Prediction for unlisted pen
  const fallbackPred = await request("/api/predictions", {
    method: "POST",
    body: {
      enteredBrand: "Pilot",
      enteredModel: "G2 Gel",
      inkRating: 6,
      writingStyle: "normal",
      notebookType: "queen_book",
    },
  });
  assert(fallbackPred.status === 201, "POST /api/predictions with manual brand returns 201");
  assert(fallbackPred.json?.data?.isFallbackEstimate === true, "Unlisted pen marked isFallbackEstimate = true");
  assert(fallbackPred.json?.data?.confidence === "low", "Fallback prediction confidence = low");

  // 6. Auth Flow
  console.log("\n📋 6. Authentication & Admin Security");
  const login = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@example.com",
      password: "Admin@inklife1",
    },
  });
  assert(login.status === 200, "POST /api/auth/login with seeded admin credentials returns 200");
  const adminToken = login.json?.data?.token;
  assert(typeof adminToken === "string" && adminToken.length > 20, "JWT token returned in login response");

  // Bad login
  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@example.com",
      password: "WrongPassword!",
    },
  });
  assert(badLogin.status === 401, "Login with wrong password returns 401");
  assert(badLogin.json?.error?.code === "UNAUTHORIZED", "Error code is UNAUTHORIZED");

  // Admin route without token
  const unauth = await request("/api/admin/claims/pending");
  assert(unauth.status === 401, "GET /api/admin/claims/pending without token returns 401");

  // Admin route with valid token
  const pendingClaims = await request("/api/admin/claims/pending", { token: adminToken });
  assert(pendingClaims.status === 200, "GET /api/admin/claims/pending with Bearer token returns 200");

  // 7. Search Lookup Pipeline
  console.log("\n📋 7. Web-Search Lookup Pipeline");
  const lookup = await request("/api/search-lookups", {
    method: "POST",
    body: {
      brand: "Hauser",
      model: "XO",
    },
  });
  assert(lookup.status === 200, "POST /api/search-lookups returns 200");
  assert(typeof lookup.json?.data?.lookupId === "string", "Lookup returns lookupId UUID");
  assert(
    lookup.json?.data?.status === "completed" || lookup.json?.data?.status === "cached",
    "Lookup status is completed or cached"
  );

  // 8. Error Envelope Standards & Validation
  console.log("\n📋 8. Error Handling & Consistency");
  const invalidPred = await request("/api/predictions", {
    method: "POST",
    body: {
      inkRating: 99, // exceeds max 10
      writingStyle: "invalid_style",
      notebookType: "queen_book",
    },
  });
  assert(invalidPred.status === 422, "Invalid prediction body returns 422");
  assert(invalidPred.json?.success === false, "Error response has success: false");
  assert(invalidPred.json?.error?.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");
  assert(Array.isArray(invalidPred.json?.error?.details), "Validation details array provided");
  assert(typeof invalidPred.json?.requestId === "string", "Error response includes requestId");
  assert(typeof invalidPred.json?.timestamp === "string", "Error response includes ISO timestamp");

  const notFound = await request("/api/nonexistent-endpoint-404");
  assert(notFound.status === 404, "Unknown route returns 404");
  assert(notFound.json?.error?.code === "NOT_FOUND", "404 code is NOT_FOUND");

  // Summary
  console.log("\n────────────────────────────────────────────────────────────");
  console.log(`E2E Verification Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} check(s) failed:`);
    failures.forEach((f) => console.error(f));
    throw new Error(`${failed} check(s) failed`);
  } else {
    console.log(`\n🎉 All ${passed} E2E checks passed successfully!\n`);
  }
}

runE2E();
