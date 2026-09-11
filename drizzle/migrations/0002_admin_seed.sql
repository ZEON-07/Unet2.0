-- =============================================================================
-- Migration 0002 – Seed admin user
--
-- Creates the default admin account for local development.
-- Password: Admin@inklife1
-- Hash algorithm: PBKDF2-SHA256, 100 000 iterations, 32-byte key
--
-- ⚠️  The password hash below was generated with a unique random salt.
--     It is safe to commit – only the hash goes in the DB, never the secret.
--     In production, create a real admin via the API or a separate secure script.
-- =============================================================================

INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  role,
  password_hash,
  email_verified,
  created_at,
  updated_at
) VALUES (
  '01919000-0000-7000-8000-000000000099',
  'admin@example.com',
  'InkLife Admin',
  'admin',
  'pbkdf2:sha256:100000:tpUXQ4dDYW3lFXHIN3bqNQ==:Z1YxRpWRD5313bqbVUyj+C6ultJHxLY0WYyk0cmG8UQ=',
  1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
