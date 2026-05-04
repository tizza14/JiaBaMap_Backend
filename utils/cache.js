const STALE_WINDOW = 24 * 60 * 60 * 1000; // 過期後仍保留 24 小時供降級使用

class TTLCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      staleUntil: Date.now() + ttlMs + STALE_WINDOW,
    });
  }

  // 正常取值（TTL 內）
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) return null;
    return entry.value;
  }

  // 降級取值（TTL 過期但 staleUntil 未到）
  getStale(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.staleUntil) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  clear() {
    this.store.clear();
  }

  startCleanup(intervalMs = 5 * 60 * 1000) {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.staleUntil) this.store.delete(key);
      }
    }, intervalMs);
  }
}

// ── Per-IP 限速器 ────────────────────────────────────────────────────
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.store = new Map();
  }

  check(ip) {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) return false;

    entry.count++;
    return true;
  }

  remaining(ip) {
    const entry = this.store.get(ip);
    if (!entry || Date.now() > entry.resetAt) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }
}

// ── 全域每日 API 呼叫計數器 ──────────────────────────────────────────
class DailyQuota {
  constructor(dailyLimit) {
    this.dailyLimit = dailyLimit;
    this.count = 0;
    this.resetAt = this._nextMidnight();

    setInterval(() => {
      if (Date.now() >= this.resetAt) {
        this.count = 0;
        this.resetAt = this._nextMidnight();
        console.log('[Quota] 每日 Google API 計數已重置');
      }
    }, 60 * 1000);
  }

  _nextMidnight() {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
  }

  consume() {
    if (this.count >= this.dailyLimit) return false;
    this.count++;
    return true;
  }

  get used() { return this.count; }
  get limit() { return this.dailyLimit; }
  get remaining() { return Math.max(0, this.dailyLimit - this.count); }
}

// ── 匯出實例 ─────────────────────────────────────────────────────────
const cache = new TTLCache();
cache.startCleanup();

const rateLimiters = {
  search:    new RateLimiter(15, 60 * 1000),
  detail:    new RateLimiter(30, 60 * 1000),
  photo:     new RateLimiter(60, 60 * 1000),
  staticmap: new RateLimiter(10, 60 * 1000),
};

const dailyQuota = new DailyQuota(500);

const TTL = {
  SEARCH:     2 * 60 * 60 * 1000,   // 2 小時（原 10 分鐘）
  DETAIL:     1 * 60 * 60 * 1000,   // 1 小時
  PHOTO:     24 * 60 * 60 * 1000,   // 24 小時
  STATIC_MAP:24 * 60 * 60 * 1000,   // 24 小時
};

module.exports = { cache, TTL, rateLimiters, dailyQuota };
