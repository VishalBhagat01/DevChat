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
