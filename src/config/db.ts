import mongoose from "mongoose";
import { initializeRoles } from "../init/initRoles";
import 'dotenv-flow/config';

// 从环境变量读取 MongoDB 连接 URI
const MONGO_URI =process.env.MONGO_URL;
console.log(MONGO_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB 连接成功");
    initializeRoles()
  } catch (error) {
    console.error("❌ MongoDB 连接失败:", error);
    process.exit(1); // 终止进程
  }
};

export default connectDB;