import Redis from "ioredis";

const createRedisClient = () => {
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

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.warn(`[Redis Warning] ${err.message}`);
});

export default redisClient;