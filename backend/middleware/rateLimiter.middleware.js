import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../services/redis.service.js';

class ResilientStore {
    constructor(prefix = 'rl:') {
        this.memoryStore = new MemoryStore();
        this.prefix = prefix;
        this.redisStore = null;
        this.options = null;

        redisClient.on('ready', () => {
            this.initRedis();
        });

        if (redisClient.status === 'ready') {
            this.initRedis();
        }
    }

    initRedis() {
        try {
            this.redisStore = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
                prefix: this.prefix
            });
            if (this.options) {
                this.redisStore.init(this.options);
            }
        } catch (err) {
            console.warn(`[RateLimit] Failed to initialize RedisStore for ${this.prefix}:`, err.message);
            this.redisStore = null;
        }
    }

    init(options) {
        this.options = options;
        this.memoryStore.init(options);
        if (redisClient.status === 'ready' && !this.redisStore) {
            this.initRedis();
        }
    }

    async get(key) {
        if (this.redisStore && redisClient.status === 'ready') {
            try {
                return await this.redisStore.get(key);
            } catch (err) {
                // Failover to MemoryStore if Redis is temporarily unreachable
            }
        }
        return this.memoryStore.get(key);
    }

    async increment(key) {
        if (this.redisStore && redisClient.status === 'ready') {
            try {
                return await this.redisStore.increment(key);
            } catch (err) {
                // Failover to MemoryStore if Redis is temporarily unreachable
            }
        }
        return this.memoryStore.increment(key);
    }

    async decrement(key) {
        if (this.redisStore && redisClient.status === 'ready') {
            try {
                return await this.redisStore.decrement(key);
            } catch (err) {
                // Failover to MemoryStore
            }
        }
        return this.memoryStore.decrement(key);
    }

    async resetKey(key) {
        if (this.redisStore && redisClient.status === 'ready') {
            try {
                return await this.redisStore.resetKey(key);
            } catch (err) {
                // Failover to MemoryStore
            }
        }
        return this.memoryStore.resetKey(key);
    }

    async resetAll() {
        if (this.redisStore && redisClient.status === 'ready') {
            try {
                return await this.redisStore.resetAll();
            } catch (err) {
                // Failover to MemoryStore
            }
        }
        return this.memoryStore.resetAll();
    }
}

// Per-IP rate limiter for AI requests (10 requests per minute per IP)
export const aiIpRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new ResilientStore('rl:ai:ip:'),
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: {
        error: 'Too many AI requests from this IP address. Please wait a minute before trying again.'
    }
});

// Per-user rate limiter for AI requests (10 requests per minute per authenticated user)
export const aiUserRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new ResilientStore('rl:ai:user:'),
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?._id;
        if (userId) {
            return `user:${userId}`;
        }
        return ipKeyGenerator(req.ip);
    },
    message: {
        error: 'Too many AI requests for this account. Please wait a minute before trying again.'
    }
});

// Combined AI rate limiter: applies both per-IP and per-user throttling
export const aiRateLimiter = [aiIpRateLimiter, aiUserRateLimiter];

// ─── Auth Rate Limiter ───────────────────────────────────────────────────────
// Strict limit for /login and /register: 7 requests per 15 minutes per IP.
// Defends against credential stuffing, brute force, and registration spam.
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 7,
    standardHeaders: true,
    legacyHeaders: false,
    store: new ResilientStore('rl:auth:'),
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    skipSuccessfulRequests: false,
    message: {
        error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
    }
});

// ─── Sensitive Endpoints Rate Limiter ────────────────────────────────────────
// For sensitive but authenticated endpoints like /projects/create, /projects/add-user.
// Max 20 requests per 15 minutes per IP.
export const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: new ResilientStore('rl:sensitive:'),
    keyGenerator: (req) => {
        const userId = req.user?.id || req.user?._id;
        if (userId) {
            return `user:${userId}`;
        }
        return ipKeyGenerator(req.ip);
    },
    message: {
        error: 'Too many requests to this endpoint. Please slow down and try again later.'
    }
});

// ─── General API Rate Limiter ────────────────────────────────────────────────
// Blanket limit for all API routes: 100 requests per minute per IP.
// Acts as a last-line-of-defense against DoS and abuse.
export const generalRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: new ResilientStore('rl:general:'),
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: {
        error: 'Too many requests from this IP address. Please try again shortly.'
    }
});

// ─── Socket.IO AI Rate Limiter (in-memory, per-user) ────────────────────────
// Returns a middleware-style function for socket events.
// Max 10 @ai messages per minute per user.
const socketAiBuckets = new Map();

/**
 * Check whether a socket user is allowed to make an @ai request.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkSocketAiRateLimit(socket) {
    const userId = (socket.user?.id || socket.user?._id || socket.id).toString();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxHits = 10;

    let bucket = socketAiBuckets.get(userId);
    if (!bucket || now - bucket.windowStart > windowMs) {
        // Start a new window
        bucket = { windowStart: now, hits: 0 };
        socketAiBuckets.set(userId, bucket);
    }

    bucket.hits += 1;

    if (bucket.hits > maxHits) {
        const retryAfterMs = windowMs - (now - bucket.windowStart);
        return { allowed: false, retryAfterMs };
    }

    return { allowed: true };
}

// Periodic cleanup of stale socket rate-limit buckets (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of socketAiBuckets) {
        if (now - bucket.windowStart > 2 * 60 * 1000) {
            socketAiBuckets.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();
