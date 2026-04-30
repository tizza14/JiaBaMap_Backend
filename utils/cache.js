class TTLCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
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
        if (now > entry.expiresAt) this.store.delete(key);
      }
    }, intervalMs);
  }
}

// ── Per-IP 限速器 ────────────────────────────────────────────────────
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.store = new Map(); // ip -> { count, resetAt }
  }

  // 回傳 true = 允許，false = 超過限制
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

    // 每天午夜重置
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

  // 回傳 true = 還有配額，false = 已用完
  consume() {
    if (this.count >= this.dailyLimit) return false;
    this.count++;
    return true;
  }

  get used() { return this.count; }
  get limit() { return this.dailyLimit; }
}

// ── 匯出實例 ─────────────────────────────────────────────────────────
const cache = new TTLCache();
cache.startCleanup();

// 每個 IP 每分鐘最多呼叫次數
const rateLimiters = {
  search:    new RateLimiter(15, 60 * 1000),  // 15次/分鐘
  detail:    new RateLimiter(30, 60 * 1000),  // 30次/分鐘
  photo:     new RateLimiter(60, 60 * 1000),  // 60次/分鐘（一頁多張圖）
  staticmap: new RateLimiter(10, 60 * 1000),  // 10次/分鐘
};

// 全域每日 Google API 呼叫上限（依據你的 Google Cloud 方案調整）
const dailyQuota = new DailyQuota(500);

const TTL = {
  SEARCH:     10 * 60 * 1000,
  DETAIL:      1 * 60 * 60 * 1000,
  PHOTO:      24 * 60 * 60 * 1000,
  STATIC_MAP: 24 * 60 * 60 * 1000,
};

module.exports = { cache, TTL, rateLimiters, dailyQuota };
