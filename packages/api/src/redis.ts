import IORedis from "ioredis";

const redis = new IORedis.default(
  process.env.REDIS_URL || `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`
);

export default redis;
