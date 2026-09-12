/**
 * Idempotent Seed Script for InkLife
 *
 * Uses Prisma upsert operations so repeated execution never duplicates data.
 *
 * Seeded Pens:
 * 1. BIC Cristal Original (3000m, normal_ballpoint, transparent)
 * 2. Flair Writo-meter (10000m, liquid_rollerball, visible_refill)
 * 3. Hauser XO (1500m, smooth_low_viscosity, visible_refill)
 * 4. LINC Pentonic (1100m, smooth_low_viscosity, transparent)
 * 5. Pentel EnerGel (550m, gel, visible_refill)
 * Plus standard community models, sources, and admin/bot users.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting idempotent database seed...");

  // ── 1. Users ────────────────────────────────────────────────────────────────
  const botUser = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      email: "bot@inklife.internal",
      name: "InkLife Search Bot",
      role: "admin",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "bot@inklife.internal",
      name: "InkLife Search Bot",
      role: "admin",
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@inklife.dev" },
    update: {
      name: "System Admin",
      role: "admin",
      passwordHash:
        "pbkdf2:sha256:100000:jrX+3kbSLbj1/hSR7hNDCA==:9EhxaqkeKKEI7q7ucIgkSjTOFwDaeaVScaZiLnv2IdA=",
    },
    create: {
      id: "01919000-0000-7000-8000-000000000099",
      email: "admin@inklife.dev",
      name: "System Admin",
      role: "admin",
      // PBKDF2 hash for Admin123!
      passwordHash:
        "pbkdf2:sha256:100000:jrX+3kbSLbj1/hSR7hNDCA==:9EhxaqkeKKEI7q7ucIgkSjTOFwDaeaVScaZiLnv2IdA=",
      emailVerified: true,
    },
  });

  console.log(`✓ Seeded users: ${botUser.name}, ${adminUser.name}`);

  // ── 2. Brands ───────────────────────────────────────────────────────────────
  const brandsData = [
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
    {
      id: "01919000-0000-7000-8000-000000000004",
      name: "Cello",
      slug: "cello",
      countryOfOrigin: "IN",
    },
    {
      id: "01919000-0000-7000-8000-000000000005",
      name: "Lexi",
      slug: "lexi",
      countryOfOrigin: "IN",
    },
    {
      id: "01919000-0000-7000-8000-000000000006",
      name: "Reynolds",
      slug: "reynolds",
      countryOfOrigin: "FR",
    },
    {
      id: "01919000-0000-7000-8000-000000000007",
      name: "Pilot",
      slug: "pilot",
      countryOfOrigin: "JP",
    },
    {
      id: "01919000-0000-7000-8000-000000000008",
      name: "Linc",
      slug: "linc",
      countryOfOrigin: "IN",
    },
    {
      id: "01919000-0000-7000-8000-000000000009",
      name: "Pentel",
      slug: "pentel",
      countryOfOrigin: "JP",
    },
  ];

  for (const b of brandsData) {
    await prisma.penBrand.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        countryOfOrigin: b.countryOfOrigin,
      },
      create: b,
    });
  }
  console.log(`✓ Seeded ${brandsData.length} pen brands`);

  // ── 3. Sources ──────────────────────────────────────────────────────────────
  const sourcesData = [
    {
      id: "01919000-0000-7000-8000-000000000020",
      sourceType: "online",
      name: "BIC Official",
      url: "https://www.bicworld.com",
      countryCode: "FR",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000021",
      sourceType: "online",
      name: "Flair Writing Industries",
      url: "https://www.flairworld.com",
      countryCode: "IN",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000022",
      sourceType: "online",
      name: "Hauser Germany",
      url: "https://www.hauserpens.com",
      countryCode: "DE",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000023",
      sourceType: "online",
      name: "Linc Pen & Plastics Ltd.",
      url: "https://www.lincpen.com",
      countryCode: "IN",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000024",
      sourceType: "online",
      name: "Pentel Stationery",
      url: "https://www.pentel.com",
      countryCode: "JP",
      isVerified: true,
    },
  ];

  for (const s of sourcesData) {
    await prisma.penSource.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        url: s.url,
        isVerified: s.isVerified,
      },
      create: s,
    });
  }
  console.log(`✓ Seeded ${sourcesData.length} pen sources`);

  // ── 4. Pen Models ───────────────────────────────────────────────────────────
  const modelsData = [
    // 1. BIC Cristal Original
    {
      id: "01919000-0000-7000-8000-000000000010",
      brandId: "01919000-0000-7000-8000-000000000001",
      name: "Cristal Original",
      slug: "bic-cristal-original",
      inkType: "Ballpoint",
      barrelVisibility: "transparent",
      flowCategory: "normal_ballpoint",
      nominalMileageM: 3000,
      description:
        "The iconic BIC Cristal ballpoint pen. Transparent barrel with visible ink. Claimed 3000m writing distance.",
      isActive: true,
      isVerified: true,
    },
    // 2. Flair Writo-meter
    {
      id: "01919000-0000-7000-8000-000000000011",
      brandId: "01919000-0000-7000-8000-000000000002",
      name: "Writo-meter",
      slug: "flair-writo-meter",
      inkType: "Liquid ink",
      barrelVisibility: "visible_refill",
      flowCategory: "liquid_rollerball",
      nominalMileageM: 10000,
      description:
        "Flair Writo-meter liquid rollerball with visible refill meter. Claimed 10,000m writing distance.",
      isActive: true,
      isVerified: true,
    },
    // 3. Hauser XO
    {
      id: "01919000-0000-7000-8000-000000000012",
      brandId: "01919000-0000-7000-8000-000000000003",
      name: "XO",
      slug: "hauser-xo",
      inkType: "Low-viscosity ink",
      barrelVisibility: "visible_refill",
      flowCategory: "smooth_low_viscosity",
      nominalMileageM: 1500,
      description:
        "Hauser XO smooth hybrid low-viscosity ballpoint pen with visible refill. Claimed 1500m writing distance.",
      isActive: true,
      isVerified: true,
    },
    // 4. LINC Pentonic
    {
      id: "01919000-0000-7000-8000-000000000015",
      brandId: "01919000-0000-7000-8000-000000000008",
      name: "Pentonic",
      slug: "linc-pentonic",
      inkType: "Ultra-low-viscosity ink",
      barrelVisibility: "transparent",
      flowCategory: "smooth_low_viscosity",
      nominalMileageM: 1100,
      description:
        "LINC Pentonic with ultra-low-viscosity ink and matte black/transparent barrel. Claimed 1100m writing distance.",
      isActive: true,
      isVerified: true,
    },
    // 5. Pentel EnerGel
    {
      id: "01919000-0000-7000-8000-000000000016",
      brandId: "01919000-0000-7000-8000-000000000009",
      name: "EnerGel",
      slug: "pentel-energel",
      inkType: "Gel",
      barrelVisibility: "visible_refill",
      flowCategory: "gel",
      nominalMileageM: 550,
      description:
        "Pentel EnerGel quick-drying smooth gel rollerball with visible refill chamber. Claimed 550m writing distance.",
      isActive: true,
      isVerified: true,
    },
    // Additional classic models
    {
      id: "01919000-0000-7000-8000-000000000013",
      brandId: "01919000-0000-7000-8000-000000000004",
      name: "Pinpoint",
      slug: "cello-pinpoint",
      inkType: "Ballpoint",
      barrelVisibility: "transparent",
      flowCategory: "normal_ballpoint",
      nominalMileageM: 1500,
      description: "Cello Pinpoint 0.6mm fine tip ballpoint pen.",
      isActive: true,
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000014",
      brandId: "01919000-0000-7000-8000-000000000004",
      name: "Butterflow",
      slug: "cello-butterflow",
      inkType: "Low-viscosity ink",
      barrelVisibility: "visible_refill",
      flowCategory: "smooth_low_viscosity",
      nominalMileageM: 1200,
      description: "Cello Butterflow smooth low-viscosity ink pen.",
      isActive: true,
      isVerified: true,
    },
  ];

  for (const m of modelsData) {
    await prisma.penModel.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        inkType: m.inkType,
        flowCategory: m.flowCategory,
        barrelVisibility: m.barrelVisibility,
        nominalMileageM: m.nominalMileageM,
        description: m.description,
        isActive: m.isActive,
        isVerified: m.isVerified,
      },
      create: m,
    });
  }
  console.log(`✓ Seeded ${modelsData.length} pen models`);

  // ── 5. Manufacturer Claims ──────────────────────────────────────────────────
  const claimsData = [
    {
      id: "01919000-0000-7000-8000-000000000030",
      userId: adminUser.id,
      penModelId: "01919000-0000-7000-8000-000000000010",
      sourceId: "01919000-0000-7000-8000-000000000020",
      mileageClaimed: 3000,
      inkFlowRating: 5,
      notes: "Official manufacturer claim: BIC Cristal Original writes up to 3000 metres.",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000031",
      userId: adminUser.id,
      penModelId: "01919000-0000-7000-8000-000000000011",
      sourceId: "01919000-0000-7000-8000-000000000021",
      mileageClaimed: 10000,
      inkFlowRating: 4,
      notes: "Official manufacturer claim: Flair Writo-meter writes up to 10,000 metres.",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000032",
      userId: adminUser.id,
      penModelId: "01919000-0000-7000-8000-000000000012",
      sourceId: "01919000-0000-7000-8000-000000000022",
      mileageClaimed: 1500,
      inkFlowRating: 5,
      notes: "Official manufacturer claim: Hauser XO writes up to 1500 metres.",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000033",
      userId: adminUser.id,
      penModelId: "01919000-0000-7000-8000-000000000015",
      sourceId: "01919000-0000-7000-8000-000000000023",
      mileageClaimed: 1100,
      inkFlowRating: 5,
      notes: "Official manufacturer claim: LINC Pentonic writes up to 1100 metres.",
      isVerified: true,
    },
    {
      id: "01919000-0000-7000-8000-000000000034",
      userId: adminUser.id,
      penModelId: "01919000-0000-7000-8000-000000000016",
      sourceId: "01919000-0000-7000-8000-000000000024",
      mileageClaimed: 550,
      inkFlowRating: 5,
      notes: "Official manufacturer claim: Pentel EnerGel writes up to 550 metres.",
      isVerified: true,
    },
  ];

  for (const c of claimsData) {
    await prisma.penClaim.upsert({
      where: { id: c.id },
      update: {
        mileageClaimed: c.mileageClaimed,
        inkFlowRating: c.inkFlowRating,
        notes: c.notes,
        isVerified: c.isVerified,
      },
      create: c,
    });
  }
  console.log(`✓ Seeded ${claimsData.length} verified manufacturer claims`);

  // ── 6. Baseline Predictions ─────────────────────────────────────────────────
  const predictionsData = [
    {
      id: "01919000-0000-7000-8000-000000000040",
      penModelId: "01919000-0000-7000-8000-000000000010",
      predictedMileageM: 2550,
      confidence: "medium",
      modelVersion: "2.1.0",
      sampleSize: 1,
      resultJson: JSON.stringify({
        penName: "BIC Cristal Original",
        totalWritingLengthMeters: 3000,
        remainingDistanceMeters: 3000,
        usableDistanceMeters: 2550,
      }),
      metadata: JSON.stringify({ baseline: true }),
    },
    {
      id: "01919000-0000-7000-8000-000000000041",
      penModelId: "01919000-0000-7000-8000-000000000011",
      predictedMileageM: 8500,
      confidence: "medium",
      modelVersion: "2.1.0",
      sampleSize: 1,
      resultJson: JSON.stringify({
        penName: "Flair Writo-meter",
        totalWritingLengthMeters: 10000,
        remainingDistanceMeters: 10000,
        usableDistanceMeters: 8500,
      }),
      metadata: JSON.stringify({ baseline: true }),
    },
    {
      id: "01919000-0000-7000-8000-000000000042",
      penModelId: "01919000-0000-7000-8000-000000000012",
      predictedMileageM: 1275,
      confidence: "medium",
      modelVersion: "2.1.0",
      sampleSize: 1,
      resultJson: JSON.stringify({
        penName: "Hauser XO",
        totalWritingLengthMeters: 1500,
        remainingDistanceMeters: 1500,
        usableDistanceMeters: 1275,
      }),
      metadata: JSON.stringify({ baseline: true }),
    },
    {
      id: "01919000-0000-7000-8000-000000000043",
      penModelId: "01919000-0000-7000-8000-000000000015",
      predictedMileageM: 935,
      confidence: "medium",
      modelVersion: "2.1.0",
      sampleSize: 1,
      resultJson: JSON.stringify({
        penName: "LINC Pentonic",
        totalWritingLengthMeters: 1100,
        remainingDistanceMeters: 1100,
        usableDistanceMeters: 935,
      }),
      metadata: JSON.stringify({ baseline: true }),
    },
    {
      id: "01919000-0000-7000-8000-000000000044",
      penModelId: "01919000-0000-7000-8000-000000000016",
      predictedMileageM: 468,
      confidence: "medium",
      modelVersion: "2.1.0",
      sampleSize: 1,
      resultJson: JSON.stringify({
        penName: "Pentel EnerGel",
        totalWritingLengthMeters: 550,
        remainingDistanceMeters: 550,
        usableDistanceMeters: 468,
      }),
      metadata: JSON.stringify({ baseline: true }),
    },
  ];

  for (const p of predictionsData) {
    await prisma.prediction.upsert({
      where: { id: p.id },
      update: {
        predictedMileageM: p.predictedMileageM,
        confidence: p.confidence,
        resultJson: p.resultJson,
      },
      create: p,
    });
  }
  console.log(`✓ Seeded ${predictionsData.length} baseline predictions`);

  console.log("🎉 Idempotent seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
