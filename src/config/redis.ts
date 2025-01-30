import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
// const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
//   password: REDIS_PASSWORD, // 连接 Redis 时使用密码（如果有）
});

redisClient.on("connect", () => {
  console.log("✅ Redis 连接成功！");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis 连接失败:", err);
});

export default redisClient;