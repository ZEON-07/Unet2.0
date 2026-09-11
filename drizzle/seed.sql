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
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000004', 'Cello', 'cello', 'IN',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000005', 'Lexi', 'lexi', 'IN',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000006', 'Reynolds', 'reynolds', 'FR',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000007', 'Pilot', 'pilot', 'JP',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  ('01919000-0000-7000-8000-000000000008', 'Linc', 'linc', 'IN',
   strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- ─── Pen Models ───────────────────────────────────────────────────────────────

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
  ),
  (
    '01919000-0000-7000-8000-000000000013',
    '01919000-0000-7000-8000-000000000004',
    'Pinpoint',
    'cello-pinpoint',
    'normal_ballpoint',
    'transparent',
    1500.0,
    'Cello Pinpoint with 0.6mm fine tip and elasto-grip for smooth non-stop writing.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000014',
    '01919000-0000-7000-8000-000000000004',
    'Butterflow',
    'cello-butterflow',
    'smooth_low_viscosity',
    'visible_refill',
    1200.0,
    'Cello Butterflow equipped with Lubriflow ink system for ultra-low resistance gliding writing.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000015',
    '01919000-0000-7000-8000-000000000004',
    'Gripper',
    'cello-gripper',
    'normal_ballpoint',
    'transparent',
    1800.0,
    'Cello Gripper 0.5mm ballpoint pen with soft non-slip grip and reliable write-out distance.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000016',
    '01919000-0000-7000-8000-000000000005',
    '5N',
    'lexi-5n',
    'normal_ballpoint',
    'transparent',
    2000.0,
    'Lexi 5N iconic exam ballpoint pen known for steady ink flow, comfortable grip, and 2 km capacity.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000017',
    '01919000-0000-7000-8000-000000000006',
    '045 Laser Carbure',
    'reynolds-045-laser-carbure',
    'normal_ballpoint',
    'transparent',
    2500.0,
    'The timeless Reynolds 045 Laser Carbure with laser-cut tungsten carbide tip and high-yield reservoir.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000018',
    '01919000-0000-7000-8000-000000000006',
    'Trimax',
    'reynolds-trimax',
    'liquid_rollerball',
    'visible_refill',
    1500.0,
    'Reynolds Trimax advanced fluid ink system rollerball with visible cartridge window.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000019',
    '01919000-0000-7000-8000-000000000007',
    'V5 Hi-Tecpoint',
    'pilot-v5-hi-tecpoint',
    'liquid_rollerball',
    'visible_refill',
    1800.0,
    'Pilot V5 Hi-Tecpoint liquid ink precision pen with 3-dimple tip system and pure liquid reservoir.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-00000000001a',
    '01919000-0000-7000-8000-000000000007',
    'G2 0.7',
    'pilot-g2-07',
    'gel',
    'transparent',
    1200.0,
    'Pilot G2 premium retractable gel roller with archival ink and ergonomic rubber grip.',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-00000000001b',
    '01919000-0000-7000-8000-000000000008',
    'Pentonic',
    'linc-pentonic',
    'smooth_low_viscosity',
    'opaque',
    1500.0,
    'Linc Pentonic featherlite low-viscosity ball pen with sleek matte-black barrel.',
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

-- ─── Pen Claims ───────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO pen_claims (
  id, user_id, pen_model_id, source_id,
  mileage_claimed, is_verified, notes,
  created_at, updated_at
)
VALUES
  (
    '01919000-0000-7000-8000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    '01919000-0000-7000-8000-000000000010',
    '01919000-0000-7000-8000-000000000022',
    3000.0,
    1,
    'Manufacturer certified writing distance of 3 km under standard testing.',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000031',
    '00000000-0000-0000-0000-000000000001',
    '01919000-0000-7000-8000-000000000011',
    '01919000-0000-7000-8000-000000000020',
    10000.0,
    1,
    'Manufacturer certified 10,000 meters continuous write-out length.',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '01919000-0000-7000-8000-000000000032',
    '00000000-0000-0000-0000-000000000001',
    '01919000-0000-7000-8000-000000000012',
    '01919000-0000-7000-8000-000000000020',
    1500.0,
    1,
    'Manufacturer certified 1,500 meters writing length for low-viscosity ink.',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );
