-- =============================================================================
-- InkLife Seed Data
-- Apply with: wrangler d1 execute inklife-db --local --file=drizzle/seed.sql
-- Apply remote: wrangler d1 execute inklife-db --remote --file=drizzle/seed.sql
-- =============================================================================

-- ─── Pen Brands ───────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO pen_brands (id, name, slug, country_of_origin, created_at, updated_at)
VALUES
  ('01919000-0000-7000-8000-000000000001', 'BIC', 'bic', 'FR',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000002', 'Flair', 'flair', 'IN',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000003', 'Hauser', 'hauser', 'DE',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- ─── Pen Models ───────────────────────────────────────────────────────────────
-- Required seed pens:
--   1. BIC Cristal Original  – 3000 m, normal_ballpoint,       transparent
--   2. Flair Writo-meter     – 10000 m, liquid_rollerball,     visible_refill
--   3. Hauser XO             – 1500 m,  smooth_low_viscosity,  visible_refill

INSERT OR IGNORE INTO pen_models (
  id, brand_id, name, slug,
  flow_category, barrel_visibility,
  nominal_mileage_m, description, is_active,
  created_at, updated_at
)
VALUES
  (
    '01919000-0000-7000-8000-000000000010',
    '01919000-0000-7000-8000-000000000001',
    'Cristal Original',
    'bic-cristal-original',
    'normal_ballpoint',
    'transparent',
    3000.0,
    'The iconic BIC Cristal ballpoint pen. Transparent barrel lets you see remaining ink. Rated at 3 km of writing.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000011',
    '01919000-0000-7000-8000-000000000002',
    'Writo-meter',
    'flair-writo-meter',
    'liquid_rollerball',
    'visible_refill',
    10000.0,
    'Flair''s Writo-meter is a liquid rollerball with a visible refill cartridge. Claimed 10 km of writing – one of the highest in its class.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000012',
    '01919000-0000-7000-8000-000000000003',
    'XO',
    'hauser-xo',
    'smooth_low_viscosity',
    'visible_refill',
    1500.0,
    'Hauser XO uses a smooth low-viscosity ink formula with a visible refill. Rated at 1.5 km of writing.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );

-- ─── Pen Sources ──────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO pen_sources (id, source_type, name, url, country_code, is_verified, created_at, updated_at)
VALUES
  ('01919000-0000-7000-8000-000000000020', 'online',  'Amazon India',   'https://www.amazon.in',    'IN', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('01919000-0000-7000-8000-000000000021', 'offline', 'Local Stationery', NULL,                     NULL, 0,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('01919000-0000-7000-8000-000000000022', 'online',  'BIC Official',   'https://www.bicworld.com', 'FR', 1,
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
