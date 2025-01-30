import redisClient from "../config/redis";

const storeVerificationCode = async (email: string, code: string) => {
  // 将验证码存储到 Redis，设置过期时间为 5 分钟
  await redisClient.setex(`verificationCode:${email}`, 300, code);
  console.log(`✅ 验证码存储成功：${code}`);
};

export default storeVerificationCode