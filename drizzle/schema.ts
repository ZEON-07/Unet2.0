/**
 * InkLife – Drizzle ORM Schema for Cloudflare D1 (SQLite)
 *
 * All enums are stored as TEXT with CHECK constraints since D1/SQLite has no
 * native ENUM type. Drizzle's `sqliteTable` is used throughout.
 *
 * ID strategy: UUIDs generated at the application layer (crypto.randomUUID()).
 */

import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Current UTC timestamp as ISO-8601 string, used for default values. */
const now = sql<string>`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    /** "user" | "admin" */
    role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
    passwordHash: text("password_hash"),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

// ─── PenBrand ─────────────────────────────────────────────────────────────────

export const penBrands = sqliteTable(
  "pen_brands",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    countryOfOrigin: text("country_of_origin"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    slugIdx: uniqueIndex("pen_brands_slug_idx").on(t.slug),
  })
);

// ─── PenModel ─────────────────────────────────────────────────────────────────

export const penModels = sqliteTable(
  "pen_models",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => penBrands.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    /**
     * "normal_ballpoint" | "liquid_rollerball" | "smooth_low_viscosity"
     * | "gel" | "fiber_tip" | "felt_tip"
     */
    flowCategory: text("flow_category", {
      enum: [
        "normal_ballpoint",
        "liquid_rollerball",
        "smooth_low_viscosity",
        "gel",
        "fiber_tip",
        "felt_tip",
      ],
    }).notNull(),
    /**
     * "transparent" | "visible_refill" | "opaque" | "semi_transparent"
     */
    barrelVisibility: text("barrel_visibility", {
      enum: ["transparent", "visible_refill", "opaque", "semi_transparent"],
    }).notNull(),
    /** Nominal mileage in metres as stated by the manufacturer */
    nominalMileageM: real("nominal_mileage_m"),
    /** Community-measured mileage in metres */
    communityMileageM: real("community_mileage_m"),
    imageUrl: text("image_url"),
    description: text("description"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    slugIdx: uniqueIndex("pen_models_slug_idx").on(t.slug),
    brandIdx: index("pen_models_brand_idx").on(t.brandId),
    flowIdx: index("pen_models_flow_idx").on(t.flowCategory),
    visibilityIdx: index("pen_models_visibility_idx").on(t.barrelVisibility),
  })
);

// ─── PenSource ────────────────────────────────────────────────────────────────

export const penSources = sqliteTable(
  "pen_sources",
  {
    id: text("id").primaryKey(),
    /** "online" | "offline" | "hybrid" */
    sourceType: text("source_type", {
      enum: ["online", "offline", "hybrid"],
    }).notNull(),
    name: text("name").notNull(),
    url: text("url"),
    countryCode: text("country_code", { length: 2 }),
    isVerified: integer("is_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    typeIdx: index("pen_sources_type_idx").on(t.sourceType),
    countryIdx: index("pen_sources_country_idx").on(t.countryCode),
  })
);

// ─── PenClaim ─────────────────────────────────────────────────────────────────

export const penClaims = sqliteTable(
  "pen_claims",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    penModelId: text("pen_model_id")
      .notNull()
      .references(() => penModels.id, { onDelete: "restrict" }),
    sourceId: text("source_id").references(() => penSources.id, {
      onDelete: "set null",
    }),
    /** ISO-8601 date string of purchase */
    purchasedAt: text("purchased_at"),
    /** User-reported mileage in metres */
    mileageClaimed: real("mileage_claimed"),
    /** 1–5 subjective ink-flow quality rating */
    inkFlowRating: integer("ink_flow_rating"),
    notes: text("notes"),
    isVerified: integer("is_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => ({
    userIdx: index("pen_claims_user_idx").on(t.userId),
    modelIdx: index("pen_claims_model_idx").on(t.penModelId),
    sourceIdx: index("pen_claims_source_idx").on(t.sourceId),
    createdIdx: index("pen_claims_created_idx").on(t.createdAt),
  })
);

// ─── Prediction ───────────────────────────────────────────────────────────────

export const predictions = sqliteTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    /** Nullable – null when prediction was made for a manually entered pen not found in DB */
    penModelId: text("pen_model_id").references(() => penModels.id, {
      onDelete: "cascade",
    }),
    /** Predicted usable writing distance in metres */
    predictedMileageM: real("predicted_mileage_m").notNull(),
    /** "low" | "medium" | "high" | "very_high" */
    confidence: text("confidence", {
      enum: ["low", "medium", "high", "very_high"],
    }).notNull(),
    /** Semantic version of the calculation engine, e.g. "2.0.0" */
    modelVersion: text("model_version").notNull(),
    /** Number of community claims used (0 for manufacturer-only estimates) */
    sampleSize: integer("sample_size").notNull().default(0),
    /** Full serialised prediction request + result DTO (JSON) – used by GET /api/predictions/:id */
    resultJson: text("result_json"),
    /** Additional model metadata as JSON string */
    metadata: text("metadata"),
    computedAt: text("computed_at").notNull().default(now),
  },
  (t) => ({
    modelIdx: index("predictions_model_idx").on(t.penModelId),
    computedIdx: index("predictions_computed_idx").on(t.computedAt),
    confidenceIdx: index("predictions_confidence_idx").on(t.confidence),
  })
);


// ─── SearchLookup ─────────────────────────────────────────────────────────────

export const searchLookups = sqliteTable(
  "search_lookups",
  {
    id: text("id").primaryKey(),
    query: text("query").notNull(),
    /** Matched pen model (null = no match) */
    penModelId: text("pen_model_id").references(() => penModels.id, {
      onDelete: "set null",
    }),
    resultCount: integer("result_count").notNull().default(0),
    /** Client IP hash (not raw IP, for privacy) */
    clientIpHash: text("client_ip_hash"),
    searchedAt: text("searched_at").notNull().default(now),
  },
  (t) => ({
    queryIdx: index("search_lookups_query_idx").on(t.query),
    modelIdx: index("search_lookups_model_idx").on(t.penModelId),
    searchedAtIdx: index("search_lookups_searched_at_idx").on(t.searchedAt),
  })
);

// ─── AdminAuditLog ────────────────────────────────────────────────────────────

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** Action performed, e.g. "CREATE_PEN_MODEL", "DELETE_USER" */
    action: text("action").notNull(),
    /** Resource type affected, e.g. "PenModel", "User" */
    targetType: text("target_type").notNull(),
    /** ID of the affected resource */
    targetId: text("target_id"),
    /** JSON string of before/after or additional context */
    metadata: text("metadata"),
    /** Client IP at time of action */
    clientIp: text("client_ip"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => ({
    adminIdx: index("audit_logs_admin_idx").on(t.adminUserId),
    actionIdx: index("audit_logs_action_idx").on(t.action),
    targetIdx: index("audit_logs_target_idx").on(t.targetType, t.targetId),
    createdIdx: index("audit_logs_created_idx").on(t.createdAt),
  })
);

// ─── Inferred TypeScript types ────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type PenBrand = typeof penBrands.$inferSelect;
export type NewPenBrand = typeof penBrands.$inferInsert;

export type PenModel = typeof penModels.$inferSelect;
export type NewPenModel = typeof penModels.$inferInsert;

export type PenSource = typeof penSources.$inferSelect;
export type NewPenSource = typeof penSources.$inferInsert;

export type PenClaim = typeof penClaims.$inferSelect;
export type NewPenClaim = typeof penClaims.$inferInsert;

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;

export type SearchLookup = typeof searchLookups.$inferSelect;
export type NewSearchLookup = typeof searchLookups.$inferInsert;

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
