/**
 * Programmatic seed runner.
 * This file is NOT executed on Workers — it runs locally via:
 *   npx tsx drizzle/seed.ts
 *
 * It uses the D1 HTTP API (drizzle-kit driver) so it can be run
 * against a remote D1 database with proper credentials.
 *
 * For local development, prefer the SQL seed file:
 *   wrangler d1 execute inklife-db --local --file=drizzle/seed.sql
 */

// UUIDs are pre-defined so seeds are idempotent (INSERT OR IGNORE)
const BRANDS = [
  {
    id: "01919000-0000-7000-8000-000000000001",
    name: "BIC",
    slug: "bic",
    countryOfOrigin: "FR",
  },
  {
    id: "01919000-0000-7000-8000-000000000002",
    name: "Flair",
    slug: "flair",
    countryOfOrigin: "IN",
  },
  {
    id: "01919000-0000-7000-8000-000000000003",
    name: "Hauser",
    slug: "hauser",
    countryOfOrigin: "DE",
  },
] as const;

const MODELS = [
  {
    id: "01919000-0000-7000-8000-000000000010",
    brandId: "01919000-0000-7000-8000-000000000001",
    name: "Cristal Original",
    slug: "bic-cristal-original",
    flowCategory: "normal_ballpoint" as const,
    barrelVisibility: "transparent" as const,
    nominalMileageM: 3000,
    description:
      "The iconic BIC Cristal ballpoint pen. Transparent barrel lets you see remaining ink. Rated at 3 km of writing.",
  },
  {
    id: "01919000-0000-7000-8000-000000000011",
    brandId: "01919000-0000-7000-8000-000000000002",
    name: "Writo-meter",
    slug: "flair-writo-meter",
    flowCategory: "liquid_rollerball" as const,
    barrelVisibility: "visible_refill" as const,
    nominalMileageM: 10000,
    description:
      "Flair's Writo-meter is a liquid rollerball with a visible refill cartridge. Claimed 10 km of writing.",
  },
  {
    id: "01919000-0000-7000-8000-000000000012",
    brandId: "01919000-0000-7000-8000-000000000003",
    name: "XO",
    slug: "hauser-xo",
    flowCategory: "smooth_low_viscosity" as const,
    barrelVisibility: "visible_refill" as const,
    nominalMileageM: 1500,
    description:
      "Hauser XO uses a smooth low-viscosity ink formula with a visible refill. Rated at 1.5 km of writing.",
  },
] as const;

const SOURCES = [
  {
    id: "01919000-0000-7000-8000-000000000020",
    sourceType: "online" as const,
    name: "Amazon India",
    url: "https://www.amazon.in",
    countryCode: "IN",
    isVerified: true,
  },
  {
    id: "01919000-0000-7000-8000-000000000021",
    sourceType: "offline" as const,
    name: "Local Stationery",
    url: null,
    countryCode: null,
    isVerified: false,
  },
  {
    id: "01919000-0000-7000-8000-000000000022",
    sourceType: "online" as const,
    name: "BIC Official",
    url: "https://www.bicworld.com",
    countryCode: "FR",
    isVerified: true,
  },
] as const;

console.log("✅ Seed data definitions loaded.");
console.log(
  "ℹ️  To seed a local D1 database, run:\n" +
  "   wrangler d1 execute inklife-db --local --file=drizzle/seed.sql\n\n" +
  "   To seed a remote D1 database, run:\n" +
  "   wrangler d1 execute inklife-db --remote --file=drizzle/seed.sql"
);

export { BRANDS, MODELS, SOURCES };
