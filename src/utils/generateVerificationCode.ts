import { randomInt } from "crypto";

const generateVerificationCode = () => {
  return randomInt(100000, 999999).toString(); // 生成一个 6 位的随机验证码
};

export default generateVerificationCode