import mongoose from "mongoose";

// 从环境变量读取 MongoDB 连接 URI
const MONGO_URI =process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB 连接成功");
  } catch (error) {
    console.error("❌ MongoDB 连接失败:", error);
    process.exit(1); // 终止进程
  }
};

export default connectDB;