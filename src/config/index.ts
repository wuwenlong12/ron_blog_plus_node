import connectDB from "./db";
import redisClient from "./redis";

export const initConfig = async () => {
  await connectDB();  // 连接 MongoDB
  await redisClient;  // 显式连接 Redis
};