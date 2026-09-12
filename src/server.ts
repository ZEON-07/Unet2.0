/**
 * InkLife Fastify Server
 *
 * Standalone Node.js server powered by SQLite and Prisma ORM.
 * Configured for Coolify single-replica persistent deployment.
 */

import "dotenv/config";
import crypto from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import cors from "@fastify/cors";
import { jwtVerify } from "jose";
import { prisma } from "./lib/prisma";
import { getCacheService, checkRateLimit } from "./services/cache.service";
import * as brandService from "./services/brand.service";
import * as penService from "./services/pen.service";
import * as predictionService from "./services/prediction.service";
import * as authService from "./services/auth.service";
import * as adminService from "./services/admin.service";
import { runSearchLookup } from "./services/searchLookup.service";
import { createPredictionBodySchema } from "./validators/prediction.validators";
import { searchLookupBodySchema } from "./validators/searchLookup.validators";
import { loginBodySchema } from "./validators/auth.validators";
import {
  patchClaimBodySchema,
  createPenBodySchema,
  patchPenBodySchema,
  searchLookupQuerySchema,
} from "./validators/admin.validators";
import { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError } from "./utils/errors";

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: process.env.NODE_ENV === "development" ? { level: "info" } : false,
    trustProxy: true,
  });

  // ─── 1. CORS ────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  // In non-production environments, ensure localhost:3000 is always allowed for local development
  if (process.env.NODE_ENV !== "production" && !allowedOrigins.includes("http://localhost:3000")) {
    allowedOrigins.push("http://localhost:3000");
  }

  await server.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });

  // ─── 2. Request Hook: ID & Rate Limit ───────────────────────────────────────
  server.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request.headers["x-request-id"] as string) || crypto.randomUUID();
    (request as any).requestId = requestId;
    reply.header("X-Request-Id", requestId);

    // In-memory / optional Redis rate limiter (60 req / 60 sec)
    const ip = request.ip || "127.0.0.1";
    const rl = checkRateLimit(ip, 60, 60);

    reply.header("X-RateLimit-Limit", 60);
    reply.header("X-RateLimit-Remaining", rl.remaining);
    reply.header("X-RateLimit-Reset", Math.ceil(rl.resetTime / 1000));

    if (!rl.allowed) {
      reply.status(429).send({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please slow down.",
        },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── 3. Global Error Handler ────────────────────────────────────────────────
  server.setErrorHandler((error: any, request, reply) => {
    const requestId = (request as any).requestId || "unknown";

    if (error instanceof ValidationError) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.message, details: error.details },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({
        success: false,
        error: { code: "NOT_FOUND", message: error.message },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: error.message },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof ForbiddenError) {
      return reply.status(403).send({
        success: false,
        error: { code: "FORBIDDEN", message: error.message },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    if (error instanceof ConflictError) {
      return reply.status(409).send({
        success: false,
        error: { code: "CONFLICT", message: error.message, details: error.details },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    // Zod validation errors
    if ((error as any).issues) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: (error as any).issues,
        },
        requestId,
        timestamp: new Date().toISOString(),
      });
    }

    server.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "An unexpected error occurred",
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  });

  // ─── 4. Auth Helpers ────────────────────────────────────────────────────────
  async function requireAdmin(request: FastifyRequest) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed Authorization header. Expected: Bearer <token>");
    }

    const token = authHeader.slice(7).trim();
    if (!token) throw new UnauthorizedError("Empty token in Authorization header");

    const jwtSecret = process.env.JWT_SECRET || "super-secret-inklife-jwt-key-32-chars-long!";
    const secret = new TextEncoder().encode(jwtSecret);

    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      if (payload.role !== "admin") {
        throw new ForbiddenError("Admin privileges required");
      }
      return payload;
    } catch (err: any) {
      if (err instanceof ForbiddenError) throw err;
      throw new UnauthorizedError(`Invalid or expired token: ${err.message}`);
    }
  }

  // ─── 5. Routes ──────────────────────────────────────────────────────────────

  // GET /api/health
  server.get("/api/health", async (request, reply) => {
    let dbStatus: "ok" | "error" = "ok";
    let dbLatencyMs: number | undefined;

    try {
      const t0 = Date.now();
      await prisma.$queryRawUnsafe("SELECT 1");
      dbLatencyMs = Date.now() - t0;
    } catch {
      dbStatus = "error";
    }

    const status = dbStatus === "ok" ? "ok" : "degraded";
    return reply.status(status === "ok" ? 200 : 503).send({
      success: true,
      data: {
        status,
        environment: process.env.NODE_ENV || "development",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbStatus,
            ...(dbLatencyMs !== undefined && { latencyMs: dbLatencyMs }),
          },
        },
      },
      requestId: (request as any).requestId,
    });
  });

  // GET /api/brands
  server.get("/api/brands", async (request, reply) => {
    const data = await brandService.getAllBrands(prisma);
    return reply.send({
      success: true,
      data,
      meta: { count: data.length },
      requestId: (request as any).requestId,
    });
  });

  // GET /api/brands/:brandId/models
  server.get("/api/brands/:brandId/models", async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const data = await penService.getModelsByBrand(prisma, brandId);
    return reply.send({
      success: true,
      data,
      meta: { count: data.length },
      requestId: (request as any).requestId,
    });
  });

  // GET /api/pens and GET /api/pens/search
  const handlePensSearch = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const params = {
      q: query?.q || query?.search,
      brand: query?.brand,
      inkType: query?.inkType,
      barrelVisibility: query?.barrelVisibility,
      page: query?.page ? Number(query.page) : 1,
      limit: query?.limit ? Number(query.limit) : 20,
    };
    const result = await penService.searchPens(prisma, params);
    return reply.send({
      success: true,
      data: result.items,
      pagination: result.pagination,
      requestId: (request as any).requestId,
    });
  };

  server.get("/api/pens", handlePensSearch);
  server.get("/api/pens/search", handlePensSearch);

  // GET /api/pens/:penId
  server.get("/api/pens/:penId", async (request, reply) => {
    const { penId } = request.params as { penId: string };
    const data = await penService.getPenDetail(prisma, penId);
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  // POST /api/predictions
  server.post("/api/predictions", async (request, reply) => {
    const parsed = createPredictionBodySchema.parse(request.body);
    const data = await predictionService.createPrediction(prisma, parsed);
    return reply.status(201).send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  // GET /api/predictions/:predictionId
  server.get("/api/predictions/:predictionId", async (request, reply) => {
    const { predictionId } = request.params as { predictionId: string };
    const data = await predictionService.getPrediction(prisma, predictionId);
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  // POST /api/search-lookups
  server.post("/api/search-lookups", async (request, reply) => {
    const parsed = searchLookupBodySchema.parse(request.body);
    const clientIp = request.ip || null;
    const clientIpHash = clientIp
      ? crypto.createHash("sha256").update(clientIp).digest("hex").slice(0, 16)
      : null;

    const cache = getCacheService();
    const result = await runSearchLookup(
      prisma,
      cache,
      process.env.TAVILY_API_KEY || "",
      clientIpHash,
      parsed
    );

    return reply.status(result.status === "failed" ? 500 : 200).send({
      success: true,
      data: result,
      requestId: (request as any).requestId,
    });
  });

  // POST /api/auth/login
  server.post("/api/auth/login", async (request, reply) => {
    const parsed = loginBodySchema.parse(request.body);
    const data = await authService.login(prisma, {} as any, parsed);
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  // ── Admin Routes ──

  server.get("/api/admin/claims/pending", async (request, reply) => {
    await requireAdmin(request);
    const data = await adminService.getPendingClaims(prisma);
    return reply.send({
      success: true,
      data,
      meta: { count: data.length },
      requestId: (request as any).requestId,
    });
  });

  server.patch("/api/admin/claims/:claimId", async (request, reply) => {
    const admin = await requireAdmin(request);
    const { claimId } = request.params as { claimId: string };
    const body = patchClaimBodySchema.parse(request.body);
    const clientIp = request.ip || null;

    const data = await adminService.patchClaim(
      prisma,
      admin.sub as string,
      clientIp,
      claimId,
      body
    );
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  server.post("/api/admin/pens", async (request, reply) => {
    const admin = await requireAdmin(request);
    const body = createPenBodySchema.parse(request.body);
    const clientIp = request.ip || null;

    const data = await adminService.createPen(
      prisma,
      admin.sub as string,
      clientIp,
      body
    );
    return reply.status(201).send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  server.patch("/api/admin/pens/:penId", async (request, reply) => {
    const admin = await requireAdmin(request);
    const { penId } = request.params as { penId: string };
    const body = patchPenBodySchema.parse(request.body);
    const clientIp = request.ip || null;

    const data = await adminService.patchPen(
      prisma,
      admin.sub as string,
      clientIp,
      penId,
      body
    );
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  server.get("/api/admin/search-lookups", async (request, reply) => {
    await requireAdmin(request);
    const query = searchLookupQuerySchema.parse(request.query);
    const data = await adminService.getSearchLookups(prisma, query);
    return reply.send({
      success: true,
      data,
      requestId: (request as any).requestId,
    });
  });

  return server;
}
