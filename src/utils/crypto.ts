/**
 * PBKDF2 password hashing via Web Crypto SubtleCrypto.
 *
 * Fully compatible with Cloudflare Workers (no Node.js crypto needed).
 *
 * Stored format: "pbkdf2:sha256:<iterations>:<base64-salt>:<base64-hash>"
 * This format is version-tagged so future iterations or algorithm changes
 * can be detected and re-hashed transparently.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH_BYTES = 32; // 256 bits
const HASH_ALGORITHM = "SHA-256";

/** Encode a Uint8Array to base64 (works in both Workers and Node). */
function toBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

/** Decode a base64 string to Uint8Array. */
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Import a plain-text password as a PBKDF2 CryptoKey.
 */
async function importKey(plain: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
}

/**
 * Hash a plain-text password.
 * Returns a string safe to store in the database.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await importKey(plain);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: HASH_ALGORITHM, salt: salt as any, iterations: ITERATIONS },
    key,
    KEY_LENGTH_BYTES * 8
  );
  const saltB64 = toBase64(salt);
  const hashB64 = toBase64(new Uint8Array(derivedBits));
  return `pbkdf2:sha256:${ITERATIONS}:${saltB64}:${hashB64}`;
}

/**
 * Verify a plain-text password against a stored hash string.
 * Uses a constant-time XOR comparison to prevent timing attacks.
 */
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":");
  // Format: pbkdf2:sha256:<iterations>:<salt>:<hash>
  if (parts.length !== 5 || parts[0] !== "pbkdf2") return false;

  const [, , iterStr, saltB64, hashB64] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  const salt = fromBase64(saltB64);
  const expectedHash = fromBase64(hashB64);

  const key = await importKey(plain);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: HASH_ALGORITHM, salt: salt as any, iterations },
    key,
    expectedHash.byteLength * 8
  );
  const derivedHash = new Uint8Array(derivedBits);

  // Constant-time comparison (prevent timing oracle)
  if (derivedHash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    diff |= derivedHash[i] ^ expectedHash[i];
  }
  return diff === 0;
}
