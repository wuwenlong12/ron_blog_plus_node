import jwt from "jsonwebtoken";
import * as bcrypt from "../../utils/bcrypt";
import { validateInput } from "../../utils/reg";
import {} from "../../utils/encipher";
import db, { IUser } from "../../model";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "./type";

const User = db.model("User");
//初始化系统
export const init = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // 验证输入的有效性
  const flag = validateInput(username, email, password);
  if (!flag.valid) {
    return res.send({
      code: 1,
      message: "Error: " + flag.message,
      data: {},
    });
  }

  // 检查 User 表是否已经存在数据
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return res.send({
      code: 1,
      message: "Error: 已初始化，不能再次初始化",
      data: {},
    });
  }

  // 加密密码
  const EnPassword = bcrypt.encryptin(password);

  // 创建新用户
  const data = {
    email,
    username,
    password: EnPassword,
  };
  const user = new User(data);

  // 保存用户到数据库
  const saveResult = await user.save();

  // 如果保存成功
  if (saveResult) {
    return res.send({
      code: 0,
      message: "Success: 初始化成功",
      data: {},
    });
  } else {
    // 如果保存失败
    return res.send({
      code: 1,
      message: "Error: Failed to create user.",
      data: {},
    });
  }
};

// 查询系统是否初始化
export const checkSystemInitialized = async (req: Request, res: Response) => {
  const userCount = await User.countDocuments(); // 查询 User 表中的记录数

  if (userCount > 0) {
    res.send({
      code: 0,
      message: "已初始化！", // 如果有数据，表示系统初始化成功
      data: {
        initialized: true,
      },
    });
  } else {
    res.send({
      code: 1,
      message: "系统还未初始化，请初始化系统", // 如果没有数据，表示系统未初始化
      data: {
        initialized: false,
      },
    });
  }
};

//登陆
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: 1, message: "邮箱或密码不能为空" });
  }
  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res
      .status(400)
      .json({ code: 1, message: "账号不存在，请检查邮箱输入" });
  }

  const isValid = bcrypt.verification(password, user.password);
  if (!isValid) {
    return res.status(400).json({ code: 1, message: "密码错误" });
  }

  // 生成 JWT Token
  const token = jwt.sign(
    { username: user.account, uid: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1d", algorithm: "HS256" }
  );

  // 设置 HttpOnly Cookie
  res.cookie(process.env.COOKIE_NAME as string, token, {
    httpOnly: true, // 防止前端 JavaScript 访问，避免 XSS 攻击
    // secure: process.env.NODE_ENV === "production", // 生产环境下必须 HTTPS 传输
    sameSite: "lax", // 防止 CSRF 攻击
    maxAge: 24 * 60 * 60 * 1000, // 1 天
  });

  return res.json({
    code: 0,
    message: "登录成功",
    data: {
      id: user._id,
      account: user.account,
      imgurl: user.imgurl,
      username: user.username,
    },
  });
};

//检查登陆状态
export const auth = async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies.token; // 从 Cookie 获取 token
  if (!token) {
    return res.status(200).json({ code: 1, message: "未登录" });
  }

  const decoded = jwt.verify(token, "wu0427..") as { uid: string };

  // **查询数据库获取完整的用户信息**
  const user = await User.findById(decoded.uid).select("-password").exec();
  if (!user) {
    return res.status(401).json({ code: 1, message: "用户不存在" });
  }

  res.json({
    code: 0,
    message: "已登录",
    data: user, // 返回完整的用户信息
  });
};

export const userDetails = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.auth?.uid;
  const wherestr = { _id: uid };
  const out = { password: 0 };
  try {
    const result: IUser | null = await User.findOne(wherestr, out).exec();
    if (!result) return;
    const fileUrl = result.imgurl
      ? `${req.protocol}://${req.get("host")}${result?.imgurl}`
      : ""; // 构建文件 URL
    result.imgurl = fileUrl;
    res.send({
      code: 0,
      message: "Success",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.send({
      code: 1,
      message: "Error" + error,
      data: {},
    });
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const uid = req.auth?.uid; // 从身份认证中获取用户ID
  if (!uid) {
    return res.status(401).json({ code: 1, message: "未登录" });
  }

  // 获取用户提交的更新数据
  const {
    username,
    email,
    oldPassword,
    newPassword,
    github,
    wx,
    school,
    explain,
    imgurl,
  } = req.body;

  // 1. 查找用户
  const user = await User.findById(uid);
  if (!user) {
    return res.status(404).json({ code: 1, message: "用户不存在" });
  }

  // 2. 处理邮箱修改（需要唯一性检查）
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ code: 1, message: "邮箱已被使用" });
    }
    user.email = email;
  }

  // 3. 处理密码修改（需要加密）
  // 3. 处理密码修改（需要比对旧密码和加密）
  if (oldPassword && newPassword) {
    const isOldPasswordCorrect = await bcrypt.verification(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ code: 1, message: "旧密码不正确" });
    }
    // 如果旧密码正确，则更新密码
    user.password = await bcrypt.encryptin(newPassword); // 使用 bcrypt 加密新密码
  }

  // 4. 处理其他字段（如果传入则更新，否则保持原值）
  if (username) user.username = username;
  if (github) user.github = github;
  if (wx) user.wx = wx;
  if (school) user.school = school;
  if (imgurl) user.imgurl = imgurl;
  if (Array.isArray(explain) && explain.length > 0) user.explain = explain;

  // 5. 保存更新后的数据
  await user.save();

  res.json({ code: 0, message: "用户信息更新成功"});
};
