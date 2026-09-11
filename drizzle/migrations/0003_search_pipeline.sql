-- =============================================================================
-- Migration 0003 – Search Lookup Pipeline: schema extensions + system user
--
-- Adds new columns to search_lookups for the Phase 4 pipeline.
-- Also seeds a "system bot" user that pipeline-created claims are attributed to.
--
-- SQLite cannot add NOT NULL columns without a default value, so all new
-- columns have explicit DEFAULT values.
-- =============================================================================

-- ─── System / bot user ────────────────────────────────────────────────────────
-- Pipeline-created PenClaim rows need a userId. We use this dedicated system
-- user so they are distinguishable from real user claims.

INSERT OR IGNORE INTO users (
  id, email, name, role, password_hash, email_verified, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pipeline@inklife.internal',
  'InkLife Pipeline Bot',
  'user',
  NULL,
  1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

-- ─── search_lookups extensions ────────────────────────────────────────────────

-- Status of the lookup: 'pending' | 'completed' | 'failed' | 'cached'
ALTER TABLE search_lookups ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';

-- Raw JSON response from the search provider (for auditing)
ALTER TABLE search_lookups ADD COLUMN raw_result TEXT;

-- How many pending PenClaim rows were created from this lookup
ALTER TABLE search_lookups ADD COLUMN pending_claims_created INTEGER NOT NULL DEFAULT 0;

-- Structured brand/model inputs (may be null when free-text query was used)
ALTER TABLE search_lookups ADD COLUMN brand TEXT;
ALTER TABLE search_lookups ADD COLUMN model TEXT;

-- Whether the result was served from KV cache
ALTER TABLE search_lookups ADD COLUMN cache_hit INTEGER NOT NULL DEFAULT 0;

-- Human-readable summary message
ALTER TABLE search_lookups ADD COLUMN message TEXT;
