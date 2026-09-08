/**
 * NotionIQ Granular Rate Limiting Middleware
 * 
 * Provides distinct rate limiting tiers configurable via environment variables:
 * - Auth (login/register): strict per-IP and per-account limits with exponential backoff
 * - AI Routes (/create-notes, /generate-quiz, /upload): strict per-user/per-IP quota tracking
 * - Notes (CRUD): loose limits
 * - Public/Read (demo docs & quizzes): moderate limits
 */

// In-memory sliding window trackers
const ipTrackers = new Map();
const userTrackers = new Map();
const authFailureTrackers = new Map();

// Cleanup interval every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipTrackers.entries()) {
    if (now - record.windowStart > record.windowMs * 2) {
      ipTrackers.delete(key);
    }
  }
  for (const [key, record] of userTrackers.entries()) {
    if (now - record.windowStart > record.windowMs * 2) {
      userTrackers.delete(key);
    }
  }
  for (const [key, record] of authFailureTrackers.entries()) {
    if (now - record.lastFailure > 60 * 60 * 1000) {
      authFailureTrackers.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Generic Rate Limiter factory
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  keyGenerator = (req) => getClientIp(req),
  message = 'Too many requests, please try again later.',
  storage = ipTrackers,
}) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = storage.get(key);
    if (!record || now - record.windowStart >= windowMs) {
      record = { count: 1, windowStart: now, windowMs };
      storage.set(key, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: retryAfterSec,
      });
    }

    return next();
  };
}

/**
 * 1. Auth Rate Limiter with Exponential Backoff on Consecutive Failures
 */
export function authRateLimiter() {
  const windowMs = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000', 10); // 1 minute
  const maxAttempts = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10); // 10 attempts per minute

  return (req, res, next) => {
    const ip = getClientIp(req);
    const email = (req.body?.email || '').trim().toLowerCase();
    const trackerKey = email ? `${ip}:${email}` : ip;
    const now = Date.now();

    // Check exponential backoff penalty
    const failureRecord = authFailureTrackers.get(trackerKey);
    if (failureRecord && failureRecord.failures >= 3) {
      // Backoff: 2^(failures - 3) * 1000ms (up to max 15 minutes)
      const penaltyMs = Math.min(Math.pow(2, failureRecord.failures - 3) * 2000, 15 * 60 * 1000);
      const remainingPenalty = (failureRecord.lastFailure + penaltyMs) - now;
      if (remainingPenalty > 0) {
        const retryAfterSec = Math.ceil(remainingPenalty / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Too many failed authentication attempts. Please wait ${retryAfterSec} seconds before trying again.`,
          retryAfter: retryAfterSec,
        });
      }
    }

    // IP window check
    let ipRecord = ipTrackers.get(`auth:${ip}`);
    if (!ipRecord || now - ipRecord.windowStart >= windowMs) {
      ipRecord = { count: 1, windowStart: now, windowMs };
      ipTrackers.set(`auth:${ip}`, ipRecord);
    } else {
      ipRecord.count++;
      if (ipRecord.count > maxAttempts) {
        const retryAfterSec = Math.ceil((ipRecord.windowStart + windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Too many authentication attempts from this IP. Please try again in a minute.',
          retryAfter: retryAfterSec,
        });
      }
    }

    // Intercept response to track authentication failures
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 401 || res.statusCode === 400) {
        const existing = authFailureTrackers.get(trackerKey) || { failures: 0 };
        existing.failures++;
        existing.lastFailure = Date.now();
        authFailureTrackers.set(trackerKey, existing);
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        // Success resets failure count
        authFailureTrackers.delete(trackerKey);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * 2. Strict AI Route Limiter (Per User or IP)
 */
export function aiRateLimiter() {
  const windowMs = parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || '60000', 10); // 1 minute
  const max = parseInt(process.env.RATE_LIMIT_AI_MAX || '10', 10); // 10 AI operations / min

  return createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => `ai:${req.session?.userId || getClientIp(req)}`,
    message: 'AI synthesis rate limit reached. Please wait a moment before initiating another generation.',
    storage: userTrackers,
  });
}

/**
 * 3. Notes CRUD Limiter
 */
export function notesRateLimiter() {
  const windowMs = parseInt(process.env.RATE_LIMIT_NOTES_WINDOW_MS || '60000', 10);
  const max = parseInt(process.env.RATE_LIMIT_NOTES_MAX || '60', 10); // 60 ops / min

  return createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => `notes:${req.session?.userId || getClientIp(req)}`,
    message: 'Notes operation rate limit exceeded.',
    storage: userTrackers,
  });
}

/**
 * 4. Public Endpoints Limiter (Demo doc browsing & demo quizzes)
 */
export function publicRateLimiter() {
  const windowMs = parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || '60000', 10);
  const max = parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '120', 10); // 120 reads / min

  return createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => `public:${getClientIp(req)}`,
    message: 'Too many requests on public resources. Please slow down.',
    storage: ipTrackers,
  });
}
