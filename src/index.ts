/**
 * InkLife Backend Entry Point
 *
 * Runs on Node.js Fastify with SQLite & Prisma ORM.
 *
 * Local database: DATABASE_URL="file:./dev.db"
 * Coolify production: DATABASE_URL="file:/app/data/inklife.db"
 *
 * Required backend replicas: 1
 */

import "dotenv/config";
import { buildServer } from "./server";
import { configureSqlitePragmas, prisma } from "./lib/prisma";

const rawPort = process.env.PORT || "3001";
const PORT = Number(rawPort);
if (!Number.isFinite(PORT) || PORT <= 0 || PORT > 65535) {
  console.error(`[Startup Error] Invalid PORT configuration: "${rawPort}". Port must be a number between 1 and 65535.`);
  process.exit(1);
}
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    // 1. Safe SQLite startup configuration
    await configureSqlitePragmas(prisma);

    // 2. Build Fastify server
    const app = await buildServer();

    // 3. Start listening
    await app.listen({ port: PORT, host: HOST });

    console.log("──────────────────────────────────────────────────");
    console.log(`🚀 InkLife Backend running on http://${HOST}:${PORT}`);
    console.log(`📦 Database: ${process.env.DATABASE_URL || "file:./dev.db"}`);
    console.log("🔒 SQLite WAL mode enabled, foreign keys ON");
    console.log("⚡ Required backend replicas: 1 (Single instance)");
    console.log("──────────────────────────────────────────────────");

    // 4. Graceful shutdown
    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}, shutting down gracefully...`);
        await app.close();
        await prisma.$disconnect();
        process.exit(0);
      });
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
