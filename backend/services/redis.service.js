import Redis from "ioredis";

export const createRedisClient = (customOptions = {}) => {
  const redisUrl = process.env.REDIS_URL;
  const redisPassword = process.env.REDIS_PASSWORD;

  const redisOptions = {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("[Redis] Maximum reconnection attempts reached. Continuing in offline cache mode.");
        return null; // Stop reconnecting endlessly
      }
      return Math.min(times * 300, 2000);
    },
    ...customOptions,
  };

  if (redisPassword) {
    redisOptions.password = redisPassword;
  }

  if (redisUrl) {
    // Ensure protocol is present if user only passed host:port
    const normalizedUrl =
      redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://")
        ? redisUrl
        : `redis://${redisUrl}`;

    return new Redis(normalizedUrl, redisOptions);
  }

  return new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    ...redisOptions,
  });
};

const redisClient = createRedisClient();
const documentStateFallback = new Map();

const getDocumentKey = (projectId, fileName) =>
  `crdt:${projectId}:${encodeURIComponent(fileName)}`;

export const getDocumentState = async (projectId, fileName) => {
  const key = getDocumentKey(projectId, fileName);
  try {
    const state = await redisClient.get(key);
    return state || documentStateFallback.get(key) || null;
  } catch (error) {
    console.warn(`[Redis Document Read Warning] ${error.message}`);
    return documentStateFallback.get(key) || null;
  }
};

export const setDocumentState = async (projectId, fileName, state) => {
  const key = getDocumentKey(projectId, fileName);
  documentStateFallback.set(key, state);
  try {
    return await redisClient.set(key, state);
  } catch (error) {
    console.warn(`[Redis Document Write Warning] ${error.message}`);
    return 'OK';
  }
};

export const setDocumentStateIfAbsent = async (projectId, fileName, state) => {
  const key = getDocumentKey(projectId, fileName);
  try {
    const result = await redisClient.set(key, state, 'NX');
    if (result === 'OK') {
      documentStateFallback.set(key, state);
    }
    return result === 'OK';
  } catch (error) {
    if (documentStateFallback.has(key)) {
      return false;
    }
    documentStateFallback.set(key, state);
    console.warn(`[Redis Document Init Warning] ${error.message}`);
    return true;
  }
};

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.warn(`[Redis Warning] ${err.message}`);
});

export default redisClient;
