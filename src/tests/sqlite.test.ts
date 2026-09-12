/**
 * SQLite & Prisma Integration Test Suite
 *
 * Verifies:
 *  1. SQLite database connection & PRAGMAs
 *  2. Prisma migration execution
 *  3. Idempotent database seed (run twice)
 *  4. Brand & model queries
 *  5. Prediction creation & retrieval
 *  6. Prediction history disk persistence
 *  7. JSON serialization & deserialization helpers
 *  8. Redis-missing memory fallback
 *  9. Zero ink calculation
 * 10. BIC at 9% with normal pressure:
 *     - Remaining distance: 270m
 *     - Usable distance: ~230m
 *     - Long Book: 31 pages
 *     - Queen Book: 38 pages
 *     - King Book: 47 pages
 *
 * Uses a separate test database file: `file:./test.db`
 * Cleans up only test.db after completion.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { serializeJson, parseJson, configureSqlitePragmas } from "../lib/prisma";
import { MemoryCacheService, checkRateLimit } from "../services/cache.service";
import * as brandRepo from "../repositories/brand.repository";
import * as penRepo from "../repositories/pen.repository";
import * as predictionRepo from "../repositories/prediction.repository";
import * as predictionService from "../services/prediction.service";
import { calculatePrediction } from "../services/prediction.engine";

const TEST_DB_PATH = path.resolve(process.cwd(), "test.db");
const TEST_DB_URL = "file:./test.db";

// Ensure tests use the separate test database
process.env.DATABASE_URL = TEST_DB_URL;

function cleanTestDbFiles() {
  const files = [
    TEST_DB_PATH,
    `${TEST_DB_PATH}-journal`,
    `${TEST_DB_PATH}-wal`,
    `${TEST_DB_PATH}-shm`,
  ];
  for (const f of files) {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {
        try {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {
          // file lock may release after process exit
        }
      }
    }
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Running InkLife SQLite & Prisma Test Suite");
  console.log("==================================================\n");

  cleanTestDbFiles();

  // ── 1. Migration Execution on Test DB ─────────────────────────────────────
  console.log("1. Testing Prisma Migration Deploy...");
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe",
    });
    console.log("   ✓ Migration deploy succeeded on test.db\n");
  } catch (err: any) {
    console.error("   ❌ Migration deploy failed:", err.stdout?.toString() || err.message);
    process.exit(1);
  }

  let testPrisma: PrismaClient | null = new PrismaClient({
    datasources: { db: { url: TEST_DB_URL } },
  });
  let freshPrisma: PrismaClient | null = null;

  try {
    // ── 2. SQLite Connection & PRAGMA Verification ──────────────────────────
    console.log("2. Testing SQLite connection and PRAGMA configuration...");
    await configureSqlitePragmas(testPrisma);
    const fkResult: any[] = await testPrisma.$queryRawUnsafe("PRAGMA foreign_keys;");
    const journalResult: any[] = await testPrisma.$queryRawUnsafe("PRAGMA journal_mode;");
    const fkVal = fkResult[0] ? Object.values(fkResult[0])[0] : null;
    const journalVal = journalResult[0] ? Object.values(journalResult[0])[0] : null;
    if (Number(fkVal) !== 1) {
      throw new Error(`Expected foreign_keys = 1, got ${fkVal}`);
    }
    if (String(journalVal).toLowerCase() !== "wal") {
      throw new Error(`Expected journal_mode = wal, got ${journalVal}`);
    }
    console.log(`   ✓ foreign_keys: ${Number(fkVal)}`);
    console.log(`   ✓ journal_mode: ${journalVal}\n`);

    // ── 3. Idempotent Seed Execution (Twice) ─────────────────────────────────
    console.log("3. Testing Idempotent Seed Script...");
    // Run seed twice to prove idempotency
    execSync("npx tsx prisma/seed.ts", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe",
    });
    execSync("npx tsx prisma/seed.ts", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe",
    });
    console.log("   ✓ Ran prisma/seed.ts twice without duplicate key errors\n");

    // ── 4. Brand & Model Queries ────────────────────────────────────────────
    console.log("4. Testing Brand & Model queries...");
    const brands = await brandRepo.findAllBrands(testPrisma);
    if (brands.length < 5) throw new Error(`Expected at least 5 brands, got ${brands.length}`);
    console.log(`   ✓ Found ${brands.length} seeded brands`);

    const bicBrand = await brandRepo.findBrandBySlug(testPrisma, "bic");
    if (!bicBrand || bicBrand.name !== "BIC") throw new Error("BIC brand query failed");
    console.log(`   ✓ Brand lookup: ${bicBrand.name} (${bicBrand.slug})`);

    const bicModel = await penRepo.findPenByIdOrSlug(testPrisma, "bic-cristal-original");
    if (!bicModel || bicModel.nominalMileageM !== 3000) {
      throw new Error("BIC Cristal Original model query failed");
    }
    console.log(`   ✓ Model lookup: ${bicModel.brandName} ${bicModel.name} (3000m)`);

    const searchResult = await penRepo.searchPens(testPrisma, {
      q: "Cristal",
      page: 1,
      limit: 10,
    });
    if (searchResult.total < 1) throw new Error("Pen search query failed");
    console.log(`   ✓ Search query for 'Cristal': ${searchResult.total} matches\n`);

    // ── 5. Prediction Creation & Retrieval ──────────────────────────────────
    console.log("5. Testing Prediction creation & retrieval...");
    const created = await predictionService.createPrediction(testPrisma, {
      penModelId: bicModel.id,
      inkPercentage: 50,
      writingStyle: "normal",
      notebookType: "queen_book",
    });

    if (!created.id || created.remainingDistanceMeters !== 1500) {
      throw new Error(`Expected remaining distance 1500m, got ${created.remainingDistanceMeters}`);
    }
    console.log(`   ✓ Created prediction: ID=${created.id}, remaining=${created.remainingDistanceMeters}m`);

    const retrieved = await predictionService.getPrediction(testPrisma, created.id);
    if (retrieved.id !== created.id || retrieved.remainingDistanceMeters !== 1500) {
      throw new Error("Retrieved prediction does not match created prediction");
    }
    console.log("   ✓ Retrieved stored prediction matches created DTO\n");

    // ── 6. Prediction Disk Persistence Across Client Reconnect ──────────────
    console.log("6. Testing Prediction disk persistence across disconnect/reconnect...");
    await testPrisma.$disconnect();
    testPrisma = null;

    freshPrisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    const reconnected = await predictionService.getPrediction(freshPrisma, created.id);
    if (!reconnected || reconnected.id !== created.id) {
      throw new Error("Data persistence failed after reconnect");
    }
    console.log("   ✓ Data verified intact after client reconnect from SQLite disk file\n");

    // ── 7. JSON Serialization & Deserialization ─────────────────────────────
    console.log("7. Testing JSON serialization/deserialization helpers...");
    const sampleObj = { brand: "BIC", mileage: 3000, active: true };
    const serialized = serializeJson(sampleObj);
    if (typeof serialized !== "string") throw new Error("serializeJson failed");

    const parsed = parseJson<typeof sampleObj | null>(serialized, null);
    if (!parsed || parsed.brand !== "BIC" || parsed.mileage !== 3000) {
      throw new Error("parseJson failed");
    }

    const fallbackResult = parseJson("invalid json", { fallback: true });
    if (!fallbackResult.fallback) throw new Error("parseJson fallback failed on invalid input");
    console.log("   ✓ serializeJson & parseJson correctly round-trip and handle fallbacks\n");

    // ── 8. Redis-Missing Memory Fallback & Rate Limiter ──────────────────────
    console.log("8. Testing Redis-missing memory cache fallback...");
    const memCache = new MemoryCacheService();
    await memCache.set("test-key", { status: "cached" }, 60);
    const cachedVal = await memCache.get<{ status: string }>("test-key");
    if (!cachedVal || cachedVal.status !== "cached") throw new Error("MemoryCacheService failed");

    await memCache.delete("test-key");
    const deletedVal = await memCache.get("test-key");
    if (deletedVal !== null) throw new Error("MemoryCacheService delete failed");

    // Rate limiter
    const rl1 = checkRateLimit("192.168.1.100", 2, 60);
    const rl2 = checkRateLimit("192.168.1.100", 2, 60);
    const rl3 = checkRateLimit("192.168.1.100", 2, 60);
    if (!rl1.allowed || !rl2.allowed || rl3.allowed) {
      throw new Error("checkRateLimit memory limiter failed");
    }
    console.log("   ✓ In-memory cache and rate limiter operate reliably without Redis\n");

    // ── 9. Zero Ink Calculation ─────────────────────────────────────────────
    console.log("9. Testing Zero Ink Calculation...");
    const zeroResult = calculatePrediction({
      claimedWritingDistanceMeters: 3000,
      inkPercentage: 0,
      writingStyle: "normal",
      notebookType: "queen_book",
      flowCategory: "normal_ballpoint",
    });

    if (
      zeroResult.remainingDistanceMeters !== 0 ||
      zeroResult.usableDistanceMeters !== 0 ||
      zeroResult.pageEstimates.longBook !== 0 ||
      zeroResult.pageEstimates.queenBook !== 0 ||
      zeroResult.pageEstimates.kingBook !== 0
    ) {
      throw new Error(
        `Zero ink calculation failed: remaining=${zeroResult.remainingDistanceMeters}, usable=${zeroResult.usableDistanceMeters}`
      );
    }
    console.log("   ✓ Zero ink produces exactly 0m remaining, 0m usable, 0 pages across all books\n");

    // ── 10. BIC at 9% with Normal Pressure (Core Verification) ──────────────
    console.log("10. Testing BIC at 9% with Normal Pressure (Golden Ratio)...");
    const bic9 = calculatePrediction({
      claimedWritingDistanceMeters: 3000,
      inkPercentage: 9,
      writingStyle: "normal",
      notebookType: "queen_book",
      flowCategory: "normal_ballpoint",
      claimAlreadyIncludesNativeFlow: true,
    });

    console.log(`   - Input: 3000m total, 9% slider, normal style`);
    console.log(`   - Remaining distance: ${bic9.remainingDistanceMeters}m (expected: 270m)`);
    console.log(`   - Usable distance: ${bic9.usableDistanceMeters}m (expected: ~230m)`);
    console.log(`   - Long Book pages: ${bic9.pageEstimates.longBook} (expected: 31)`);
    console.log(`   - Queen Book pages: ${bic9.pageEstimates.queenBook} (expected: 38)`);
    console.log(`   - King Book pages: ${bic9.pageEstimates.kingBook} (expected: 47)`);

    if (bic9.remainingDistanceMeters !== 270) {
      throw new Error(`Expected remaining distance 270m, got ${bic9.remainingDistanceMeters}`);
    }
    if (bic9.usableDistanceMeters !== 230) {
      throw new Error(`Expected usable distance 230m, got ${bic9.usableDistanceMeters}`);
    }
    if (bic9.pageEstimates.longBook !== 31) {
      throw new Error(`Expected 31 Long Book pages, got ${bic9.pageEstimates.longBook}`);
    }
    if (bic9.pageEstimates.queenBook !== 38) {
      throw new Error(`Expected 38 Queen Book pages, got ${bic9.pageEstimates.queenBook}`);
    }
    if (bic9.pageEstimates.kingBook !== 47) {
      throw new Error(`Expected 47 King Book pages, got ${bic9.pageEstimates.kingBook}`);
    }

    // Monotonic invariant check: Long Book < Queen Book < King Book
    if (
      !(
        bic9.pageEstimates.longBook < bic9.pageEstimates.queenBook &&
        bic9.pageEstimates.queenBook < bic9.pageEstimates.kingBook
      )
    ) {
      throw new Error(
        `Notebook page count ordering reversed! Must satisfy Long < Queen < King: ${JSON.stringify(bic9.pageEstimates)}`
      );
    }
    console.log("   ✓ Long Book (31) < Queen Book (38) < King Book (47) ordering strictly satisfied!\n");

    await freshPrisma.$disconnect();
    freshPrisma = null;

    console.log("==================================================");
    console.log("🎉 ALL SQLITE & PRISMA TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    if (testPrisma) {
      await testPrisma.$disconnect().catch(() => {});
    }
    if (freshPrisma) {
      await freshPrisma.$disconnect().catch(() => {});
    }
    cleanTestDbFiles();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  cleanTestDbFiles();
  process.exit(1);
});
