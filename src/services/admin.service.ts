/**
 * Admin service – business logic for all admin-only operations.
 * Every mutation writes an entry to admin_audit_logs.
 */

import { eq } from "drizzle-orm";
import { penModels } from "../../drizzle/schema";
import type { DrizzleDb } from "../repositories/db";
import * as claimRepo from "../repositories/claim.repository";
import * as auditRepo from "../repositories/auditLog.repository";
import * as searchLookupRepo from "../repositories/searchLookup.repository";
import * as brandRepo from "../repositories/brand.repository";
import * as penModelRepo from "../repositories/penModel.repository";
import * as penRepo from "../repositories/pen.repository";
import { NotFoundError, ConflictError } from "../utils/errors";
import type {
  PatchClaimBody,
  CreatePenBody,
  PatchPenBody,
  SearchLookupQuery,
} from "../validators/admin.validators";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an arbitrary string to a URL-safe slug. */
function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export async function getPendingClaims(db: DrizzleDb) {
  return claimRepo.findPendingClaims(db);
}

export async function patchClaim(
  db: DrizzleDb,
  adminId: string,
  clientIp: string | null,
  claimId: string,
  body: PatchClaimBody
) {
  const existing = await claimRepo.findClaimById(db, claimId);
  if (!existing) throw new NotFoundError("Claim", claimId);

  const updated = await claimRepo.updateClaim(db, claimId, {
    isVerified: body.isVerified,
    ...(body.notes !== undefined && { notes: body.notes }),
  });

  await auditRepo.insertAuditLog(db, {
    adminUserId: adminId,
    action: body.isVerified ? "VERIFY_CLAIM" : "REJECT_CLAIM",
    targetType: "PenClaim",
    targetId: claimId,
    metadata: JSON.stringify({
      before: { isVerified: existing.isVerified },
      after: { isVerified: body.isVerified },
      notes: body.notes,
    }),
    clientIp,
  });

  return updated;
}

// ─── Pens ─────────────────────────────────────────────────────────────────────

export async function createPen(
  db: DrizzleDb,
  adminId: string,
  clientIp: string | null,
  body: CreatePenBody
) {
  // 1. Resolve brand (find by ID or find/create by name)
  let brandId: string;

  if (body.brandId) {
    const brand = await brandRepo.findBrandById(db, body.brandId);
    if (!brand) throw new NotFoundError("PenBrand", body.brandId);
    brandId = brand.id;
  } else {
    const slug = body.brandSlug ?? toSlug(body.brandName!);
    const existing = await brandRepo.findBrandBySlug(db, slug);
    if (existing) {
      brandId = existing.id;
    } else {
      const newBrand = await penModelRepo.insertBrand(db, {
        id: crypto.randomUUID(),
        name: body.brandName!,
        slug,
        countryOfOrigin: body.brandCountry ?? null,
      });
      brandId = newBrand!.id;
    }
  }

  // 2. Build slug: "{brand-slug}-{model-slug}"
  const brand = await brandRepo.findBrandById(db, brandId);
  const modelSlug = body.slug ?? `${brand!.slug}-${toSlug(body.name)}`;

  // 3. Guard against slug collision
  const conflict = await penModelRepo.findModelBySlug(db, modelSlug);
  if (conflict) {
    throw new ConflictError(`A pen model with slug '${modelSlug}' already exists`, {
      slug: modelSlug,
    });
  }

  // 4. Insert pen model
  const penId = crypto.randomUUID();
  const pen = await penModelRepo.insertModel(db, {
    id: penId,
    brandId,
    name: body.name,
    slug: modelSlug,
    flowCategory: body.flowCategory as never,
    barrelVisibility: body.barrelVisibility as never,
    nominalMileageM: body.nominalMileageM ?? null,
    imageUrl: body.imageUrl ?? null,
    description: body.description ?? null,
    isActive: true,
  });

  // 5. Audit log
  await auditRepo.insertAuditLog(db, {
    adminUserId: adminId,
    action: "CREATE_PEN_MODEL",
    targetType: "PenModel",
    targetId: penId,
    metadata: JSON.stringify({
      name: body.name,
      slug: modelSlug,
      brandId,
      flowCategory: body.flowCategory,
    }),
    clientIp,
  });

  return pen;
}

export async function patchPen(
  db: DrizzleDb,
  adminId: string,
  clientIp: string | null,
  penId: string,
  body: PatchPenBody
) {
  // Resolve by id or slug
  const existing = await penRepo.findPenByIdOrSlug(db, penId);
  if (!existing) throw new NotFoundError("PenModel", penId);

  // Build partial update — only include fields that were explicitly provided
  const updatedAt = new Date().toISOString();
  const patch: Partial<typeof penModels.$inferInsert> & { updatedAt: string } = {
    updatedAt,
  };

  if (body.name !== undefined) patch.name = body.name;
  if (body.flowCategory !== undefined) patch.flowCategory = body.flowCategory as never;
  if (body.barrelVisibility !== undefined)
    patch.barrelVisibility = body.barrelVisibility as never;
  if (body.nominalMileageM !== undefined) patch.nominalMileageM = body.nominalMileageM;
  if (body.communityMileageM !== undefined)
    patch.communityMileageM = body.communityMileageM;
  if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
  if (body.description !== undefined) patch.description = body.description;
  if (body.isActive !== undefined) patch.isActive = body.isActive;

  const updated = await db
    .update(penModels)
    .set(patch)
    .where(eq(penModels.id, existing.id))
    .returning()
    .get();

  // Audit log
  await auditRepo.insertAuditLog(db, {
    adminUserId: adminId,
    action: "UPDATE_PEN_MODEL",
    targetType: "PenModel",
    targetId: existing.id,
    metadata: JSON.stringify({ changes: body }),
    clientIp,
  });

  return updated;
}

// ─── Search Lookups ───────────────────────────────────────────────────────────

export async function getSearchLookups(db: DrizzleDb, query: SearchLookupQuery) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;
  const { rows, total } = await searchLookupRepo.listSearchLookups(
    db,
    limit,
    offset
  );
  const totalPages = Math.ceil(total / limit);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
