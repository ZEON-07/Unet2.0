import { Hono } from "hono";
import type { HonoEnv } from "../types/bindings";

const docs = new Hono<HonoEnv>();

// ─── OpenAPI 3.1 Specification ────────────────────────────────────────────────

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "InkLife API",
    version: "1.0.0",
    description:
      "InkLife pen lifecycle tracking and mileage prediction engine. Built on Cloudflare Workers, D1 (SQLite), and KV.",
    contact: {
      name: "InkLife Engineering",
      url: "https://github.com/hari2629-p/Unet2.0",
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
      description: "Cloudflare Workers production",
    },
  ],
  tags: [
    { name: "Health", description: "Liveness and database connectivity checks" },
    { name: "Brands", description: "Pen brand directories and brand-model listings" },
    { name: "Pens", description: "Pen models, search, filters, and verified claims" },
    { name: "Predictions", description: "Ink lifecycle prediction engine and notebook estimators" },
    { name: "Authentication", description: "Admin authentication and JWT generation" },
    { name: "Admin", description: "Protected administration routes (claims, pens, audit logs)" },
    { name: "Search Pipeline", description: "Automated web-search lookup pipeline for pen writing claims" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Service Health Check",
        description: "Returns health status of the API runtime and D1 database connection.",
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
                        status: { type: "string", example: "ok" },
                        environment: { type: "string", example: "development" },
                        version: { type: "string", example: "1.0.0" },
                        timestamp: { type: "string", format: "date-time" },
                        services: {
                          type: "object",
                          properties: {
                            database: {
                              type: "object",
                              properties: {
                                status: { type: "string", example: "ok" },
                                latencyMs: { type: "number", example: 4 },
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
            description: "Database connection failed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/docs/openapi.json": {
      get: {
        tags: ["Health"],
        summary: "OpenAPI Specification JSON",
        description: "Returns the raw OpenAPI 3.1 specification in JSON format.",
        operationId: "getOpenApiSpec",
        responses: {
          "200": { description: "OpenAPI 3.1 JSON document" },
        },
      },
    },

    "/api/brands": {
      get: {
        tags: ["Brands"],
        summary: "List All Pen Brands",
        description: "Returns all active pen brands ordered alphabetically.",
        operationId: "listBrands",
        responses: {
          "200": {
            description: "Array of brand objects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Brand" },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/brands/{brandId}/models": {
      get: {
        tags: ["Brands"],
        summary: "Get Brand Pen Models",
        description: "Returns all models belonging to the specified brand ID or slug.",
        operationId: "getBrandModels",
        parameters: [
          {
            name: "brandId",
            in: "path",
            required: true,
            description: "Brand UUID or slug (e.g. 'bic')",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Array of pen models with claim summaries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PenModelSummary" },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Brand not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/pens/search": {
      get: {
        tags: ["Pens"],
        summary: "Search Pen Models",
        description: "Search and filter pen models by text query, brand, flow category, and barrel visibility.",
        operationId: "searchPens",
        parameters: [
          { name: "q", in: "query", description: "Search query text", schema: { type: "string" } },
          { name: "brand", in: "query", description: "Brand slug or name filter", schema: { type: "string" } },
          { name: "inkType", in: "query", description: "Ink flow category", schema: { $ref: "#/components/schemas/FlowCategory" } },
          { name: "barrelVisibility", in: "query", description: "Barrel transparency", schema: { $ref: "#/components/schemas/BarrelVisibility" } },
          { name: "page", in: "query", description: "Page number (default: 1)", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", description: "Items per page (default: 20, max: 100)", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated pen search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PenModelSummary" },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasNext: { type: "boolean" },
                        hasPrev: { type: "boolean" },
                      },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/pens/{penId}": {
      get: {
        tags: ["Pens"],
        summary: "Get Pen Detail",
        description: "Returns comprehensive details for a single pen model including verified source claims.",
        operationId: "getPenDetail",
        parameters: [
          {
            name: "penId",
            in: "path",
            required: true,
            description: "Pen UUID or slug (e.g. 'bic-cristal-original')",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Pen details with verified claims",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PenModelDetail" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Pen model not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/predictions": {
      post: {
        tags: ["Predictions"],
        summary: "Calculate Remaining Ink Mileage & Notebook Pages",
        description: "Calculates remaining distance in metres, usable distance adjusted for ink flow and writing style, and page capacities across standard notebook formats.",
        operationId: "createPrediction",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PredictionRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Prediction calculated and stored",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PredictionResponse" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "422": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/predictions/{predictionId}": {
      get: {
        tags: ["Predictions"],
        summary: "Retrieve Stored Prediction",
        description: "Returns a previously calculated and persisted prediction by its UUID.",
        operationId: "getPrediction",
        parameters: [
          {
            name: "predictionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Stored prediction record",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PredictionResponse" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Prediction not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Admin Login",
        description: "Authenticates an administrator with email and password, returning a signed JWT Bearer token valid for 24 hours.",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/LoginResponse" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid email or password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/admin/claims/pending": {
      get: {
        tags: ["Admin"],
        summary: "List Pending Mileage Claims",
        description: "Fetches all unverified pen writing-length claims requiring administrator approval.",
        operationId: "getPendingClaims",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of pending claims",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PendingClaim" },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "401": { description: "Missing or invalid Bearer token" },
          "403": { description: "User lacks admin role" },
        },
      },
    },

    "/api/admin/claims/{claimId}": {
      patch: {
        tags: ["Admin"],
        summary: "Verify or Reject a Pen Claim",
        description: "Updates verification status of a pending claim and writes an audit trail log entry.",
        operationId: "patchClaim",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "claimId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchClaimRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Claim updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PendingClaim" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "404": { description: "Claim not found" },
        },
      },
    },

    "/api/admin/pens": {
      post: {
        tags: ["Admin"],
        summary: "Create Pen Model",
        description: "Creates a new catalog pen model, optionally creating a new brand if not existing.",
        operationId: "createPen",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePenRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Pen created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PenModelDetail" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "409": { description: "Pen with this slug already exists" },
        },
      },
    },

    "/api/admin/pens/{penId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update Pen Model",
        description: "Modifies attributes of an existing pen model and logs to admin audit logs.",
        operationId: "patchPen",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "penId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchPenRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Pen model updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/PenModelDetail" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "404": { description: "Pen model not found" },
        },
      },
    },

    "/api/admin/search-lookups": {
      get: {
        tags: ["Admin"],
        summary: "List Search Audit Trail",
        description: "Paginated view of historical web-search lookups, cache hits, provider results, and claim extraction counts.",
        operationId: "getAdminSearchLookups",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "Paginated list of search audit entries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SearchLookupResponse" },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/search-lookups": {
      post: {
        tags: ["Search Pipeline"],
        summary: "Search Web for Pen Writing Claims",
        description: "Executes backend web-search pipeline (Tavily/Stub), extracts writing length and flow indicators, and creates unverified pending claims for admin approval. Caches queries in KV for 30 days.",
        operationId: "runSearchLookup",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SearchLookupRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Search executed or returned from cache",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/SearchLookupResponse" },
                    requestId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "422": { description: "Validation error" },
          "429": { description: "Rate limit exceeded" },
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
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Request validation failed" },
              details: { type: "array", items: { type: "object" } },
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
        example: "normal_ballpoint",
      },

      BarrelVisibility: {
        type: "string",
        enum: ["transparent", "visible_refill", "opaque", "semi_transparent"],
        example: "transparent",
      },

      WritingStyle: {
        type: "string",
        enum: ["light", "normal", "heavy"],
        example: "normal",
      },

      NotebookType: {
        type: "string",
        enum: ["long_book", "queen_book", "king_book"],
        example: "queen_book",
      },

      Confidence: {
        type: "string",
        enum: ["low", "medium", "high", "very_high"],
        example: "medium",
      },

      Brand: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "BIC" },
          slug: { type: "string", example: "bic" },
          countryOfOrigin: { type: "string", nullable: true, example: "FR" },
          logoUrl: { type: "string", nullable: true },
        },
      },

      PenClaim: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sourceName: { type: "string", example: "BIC Official" },
          sourceUrl: { type: "string", nullable: true, example: "https://www.bicworld.com" },
          mileageClaimed: { type: "number", example: 3000 },
          isVerified: { type: "boolean", example: true },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      PenModelSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Cristal Original" },
          slug: { type: "string", example: "bic-cristal-original" },
          flowCategory: { $ref: "#/components/schemas/FlowCategory" },
          barrelVisibility: { $ref: "#/components/schemas/BarrelVisibility" },
          nominalMileageM: { type: "number", nullable: true, example: 3000 },
          brand: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string", example: "BIC" },
              slug: { type: "string", example: "bic" },
            },
          },
          claimSummary: {
            type: "object",
            nullable: true,
            properties: {
              writingLengthMeters: { type: "number", example: 3000 },
              confidence: { $ref: "#/components/schemas/Confidence" },
              modelVersion: { type: "string", example: "2.0.0" },
              sampleSize: { type: "integer", example: 1 },
              computedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },

      PenModelDetail: {
        allOf: [
          { $ref: "#/components/schemas/PenModelSummary" },
          {
            type: "object",
            properties: {
              communityMileageM: { type: "number", nullable: true },
              imageUrl: { type: "string", nullable: true },
              description: { type: "string", nullable: true },
              claims: {
                type: "array",
                items: { $ref: "#/components/schemas/PenClaim" },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },

      PredictionRequest: {
        type: "object",
        required: ["inkRating", "writingStyle", "notebookType"],
        properties: {
          penModelId: { type: "string", format: "uuid", nullable: true },
          enteredBrand: { type: "string", nullable: true, example: "BIC" },
          enteredModel: { type: "string", nullable: true, example: "Cristal" },
          inkRating: { type: "integer", minimum: 0, maximum: 10, example: 8 },
          writingStyle: { $ref: "#/components/schemas/WritingStyle" },
          notebookType: { $ref: "#/components/schemas/NotebookType" },
        },
      },

      PredictionResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          penName: { type: "string", example: "BIC Cristal Original" },
          inkRating: { type: "integer", example: 8 },
          inkPercentage: { type: "integer", example: 80 },
          totalWritingLengthMeters: { type: "number", example: 3000 },
          remainingDistanceMeters: { type: "number", example: 2400 },
          usableDistanceMeters: { type: "number", example: 2400 },
          estimatedPages: { type: "integer", example: 600 },
          pageEstimates: {
            type: "object",
            properties: {
              longBook: { type: "integer", example: 706 },
              queenBook: { type: "integer", example: 600 },
              kingBook: { type: "integer", example: 500 },
            },
          },
          flowCategory: { $ref: "#/components/schemas/FlowCategory" },
          writingStyle: { $ref: "#/components/schemas/WritingStyle" },
          notebookType: { $ref: "#/components/schemas/NotebookType" },
          confidence: { $ref: "#/components/schemas/Confidence" },
          isFallbackEstimate: { type: "boolean", example: false },
          fallbackNotes: { type: "string", nullable: true },
          source: {
            type: "object",
            nullable: true,
            properties: {
              title: { type: "string", example: "BIC Official" },
              url: { type: "string", nullable: true, example: "https://www.bicworld.com" },
              checkedAt: { type: "string", format: "date-time" },
            },
          },
          computedAt: { type: "string", format: "date-time" },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", example: "Admin@inklife1" },
        },
      },

      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              role: { type: "string", example: "admin" },
            },
          },
        },
      },

      PendingClaim: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          penModelId: { type: "string", format: "uuid" },
          penName: { type: "string" },
          brandName: { type: "string" },
          mileageClaimed: { type: "number", example: 3000 },
          isVerified: { type: "boolean", example: false },
          notes: { type: "string", nullable: true },
          source: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              url: { type: "string", nullable: true },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      PatchClaimRequest: {
        type: "object",
        required: ["isVerified"],
        properties: {
          isVerified: { type: "boolean", example: true },
          notes: { type: "string", nullable: true },
        },
      },

      CreatePenRequest: {
        type: "object",
        required: ["name", "flowCategory", "barrelVisibility"],
        properties: {
          brandId: { type: "string", format: "uuid" },
          brandName: { type: "string" },
          name: { type: "string", example: "Round Stic" },
          slug: { type: "string", example: "bic-round-stic" },
          flowCategory: { $ref: "#/components/schemas/FlowCategory" },
          barrelVisibility: { $ref: "#/components/schemas/BarrelVisibility" },
          nominalMileageM: { type: "number", nullable: true, example: 2000 },
          description: { type: "string", nullable: true },
          imageUrl: { type: "string", nullable: true },
        },
      },

      PatchPenRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          flowCategory: { $ref: "#/components/schemas/FlowCategory" },
          barrelVisibility: { $ref: "#/components/schemas/BarrelVisibility" },
          nominalMileageM: { type: "number", nullable: true },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
        },
      },

      SearchLookupRequest: {
        type: "object",
        properties: {
          brand: { type: "string", example: "Hauser" },
          model: { type: "string", example: "XO" },
          query: { type: "string", nullable: true },
        },
      },

      SearchLookupResponse: {
        type: "object",
        properties: {
          lookupId: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["completed", "failed", "cached"] },
          message: { type: "string" },
          pendingClaimsCreated: { type: "integer", example: 0 },
          cachedResult: { type: "boolean", example: false },
          providerUsed: { type: "string", nullable: true, example: "stub" },
        },
      },
    },

    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Bearer token obtained from POST /api/auth/login.",
      },
    },
  },
  security: [],
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/** GET /api/docs/openapi.json – serve raw OpenAPI JSON */
docs.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});

/** GET /api/docs – serve interactive Swagger UI */
docs.get("/", (c) => {
  const specUrl = new URL(c.req.url);
  specUrl.pathname = "/api/docs/openapi.json";

  const html = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InkLife API – Interactive Documentation</title>
    <meta name="description" content="InkLife pen lifecycle tracking and prediction API documentation" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .swagger-ui .topbar { background: #111827; border-bottom: 1px solid #1f2937; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #f3f4f6; }
      .swagger-ui { color: #e5e7eb; }
      .swagger-ui .scheme-container { background: #111827; box-shadow: none; border-bottom: 1px solid #1f2937; }
      .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated { color: #f9fafb; }
      .swagger-ui section.models { border: 1px solid #1f2937; background: #111827; }
      .swagger-ui section.models h4 { color: #f3f4f6; }
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
