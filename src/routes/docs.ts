import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";

const docs = new Hono<HonoEnv>();

// ─── OpenAPI 3.1 Specification ────────────────────────────────────────────────

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "InkLife API",
    version: "0.1.0",
    description:
      "InkLife pen lifecycle tracking API. Phase 0 – Foundation (Cloudflare Workers + D1).",
    contact: {
      name: "InkLife Team",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:8787",
      description: "Local development (wrangler dev)",
    },
    {
      url: "https://inklife-api.workers.dev",
      description: "Cloudflare Workers (production)",
    },
  ],
  tags: [
    { name: "Health", description: "Service liveness and readiness checks" },
    { name: "Pens", description: "Pen brands, models, and sources (Phase 1)" },
    { name: "Claims", description: "User pen mileage claims (Phase 1)" },
    {
      name: "Predictions",
      description: "ML-based mileage predictions (Phase 2)",
    },
    { name: "Admin", description: "Admin-only routes (Phase 3)" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description:
          "Returns the current health status of the API and its dependencies.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        status: {
                          type: "string",
                          enum: ["ok", "degraded"],
                          example: "ok",
                        },
                        environment: { type: "string", example: "development" },
                        version: { type: "string", example: "0.1.0" },
                        timestamp: {
                          type: "string",
                          format: "date-time",
                          example: "2024-09-23T00:00:00.000Z",
                        },
                        services: {
                          type: "object",
                          properties: {
                            database: {
                              type: "object",
                              properties: {
                                status: {
                                  type: "string",
                                  enum: ["ok", "error"],
                                },
                                latencyMs: { type: "number" },
                              },
                            },
                          },
                        },
                      },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "503": {
            description: "Service is degraded (database unreachable)",
          },
        },
      },
    },
    "/api/docs": {
      get: {
        tags: ["Health"],
        summary: "Swagger UI",
        description: "Interactive API documentation.",
        operationId: "getDocs",
        responses: {
          "200": { description: "HTML Swagger UI page" },
        },
      },
    },
    "/api/docs/openapi.json": {
      get: {
        tags: ["Health"],
        summary: "OpenAPI specification",
        description: "Machine-readable OpenAPI 3.1 JSON specification.",
        operationId: "getOpenApiSpec",
        responses: {
          "200": { description: "OpenAPI JSON document" },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["success", "error", "requestId", "timestamp"],
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "NOT_FOUND" },
              message: { type: "string" },
              details: {},
            },
          },
          requestId: { type: "string", format: "uuid" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      FlowCategory: {
        type: "string",
        enum: [
          "normal_ballpoint",
          "liquid_rollerball",
          "smooth_low_viscosity",
          "gel",
          "fiber_tip",
          "felt_tip",
        ],
      },
      BarrelVisibility: {
        type: "string",
        enum: ["transparent", "visible_refill", "opaque", "semi_transparent"],
      },
      SourceType: {
        type: "string",
        enum: ["online", "offline", "hybrid"],
      },
      Confidence: {
        type: "string",
        enum: ["low", "medium", "high", "very_high"],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT token obtained from the /api/auth/login endpoint (Phase 1).",
      },
    },
  },
  security: [],
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /api/docs/openapi.json – serve the raw OpenAPI JSON */
docs.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});

/** GET /api/docs – serve Swagger UI (served from CDN, no bundle needed) */
docs.get("/", (c) => {
  const specUrl = new URL(c.req.url);
  specUrl.pathname = "/api/docs/openapi.json";

  const html = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InkLife API – Docs</title>
    <meta name="description" content="InkLife pen lifecycle tracking API documentation" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0f1117; }
      .swagger-ui .topbar { background: #1a1d27; border-bottom: 1px solid #2d3148; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #e2e8f0; }
      .swagger-ui { color: #e2e8f0; }
      .swagger-ui .scheme-container { background: #1a1d27; box-shadow: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: "${specUrl.toString()}",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
        deepLinking: true,
        defaultModelsExpandDepth: 2,
        displayRequestDuration: true,
        filter: true,
      });
    </script>
  </body>
</html>`;

  return c.html(html);
});

export { docs as docsRoute };
