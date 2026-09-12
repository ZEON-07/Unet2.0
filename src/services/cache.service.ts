/**
 * Cache Service with optional Redis and in-memory fallback.
 *
 * Designed for hackathon and single-replica Coolify deployments where
 * Redis may not be provisioned.
 *
 * Memory cache limitations:
 * - Cache resets when the backend restarts.
 * - Suitable only for a single backend instance (replica count = 1).
 * - Prediction and history data remain permanently stored in SQLite.
 */

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

export class MemoryCacheService implements CacheService {
  private store = new Map<string, MemoryCacheEntry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clear all expired keys (maintenance helper).
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export class RedisCacheService implements CacheService {
  private client: any = null;
  private isConnected = false;
  private memoryFallback: MemoryCacheService;

  constructor(redisUrl: string) {
    this.memoryFallback = new MemoryCacheService();
    this.initRedis(redisUrl);
  }

  private async initRedis(redisUrl: string) {
    try {
      // Dynamic import to prevent crashing if redis package is omitted in lightweight builds
      const redisModule = await (Function('return import("ioredis")')() as Promise<any>).catch(() => null);
      const Redis = redisModule?.Redis ?? redisModule?.default;
      if (Redis) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        await this.client.connect();
        this.isConnected = true;
        console.log("[Cache] Connected to Redis successfully.");
      } else {
        console.warn("[Cache] ioredis not found; falling back to in-memory cache.");
      }
    } catch (err) {
      console.warn(
        "[Cache] Could not connect to Redis; falling back to in-memory cache:",
        err
      );
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return this.memoryFallback.get<T>(key);
    }
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn("[Cache] Redis GET failed; checking memory fallback:", err);
      return this.memoryFallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.memoryFallback.set<T>(key, value, ttlSeconds);
    }
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      console.warn("[Cache] Redis SET failed; writing to memory fallback:", err);
      await this.memoryFallback.set<T>(key, value, ttlSeconds);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return this.memoryFallback.delete(key);
    }
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn("[Cache] Redis DEL failed; clearing memory fallback:", err);
      await this.memoryFallback.delete(key);
    }
  }
}

// ─── Cache Singleton Factory ──────────────────────────────────────────────────

let _cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (_cacheServiceInstance) {
    return _cacheServiceInstance;
  }

  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    _cacheServiceInstance = new RedisCacheService(redisUrl);
  } else {
    console.log("Redis is not configured; using in-memory fallback.");
    _cacheServiceInstance = new MemoryCacheService();
  }

  return _cacheServiceInstance;
}

// ─── In-Memory Rate Limiter ───────────────────────────────────────────────────

interface RateLimitBucket {
  tokens: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Lightweight sliding/fixed-window rate limiter for Fastify when Redis is not available.
 */
export function checkRateLimit(
  ip: string,
  limit = 60,
  windowSeconds = 60
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    rateLimitBuckets.set(ip, { tokens: limit - 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetTime: resetAt };
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens, resetTime: bucket.resetAt };
  }

  return { allowed: false, remaining: 0, resetTime: bucket.resetAt };
}
