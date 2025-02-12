import jwt from "jsonwebtoken";
import * as bcrypt from "../../utils/bcrypt";
import { validateInput } from "../../utils/reg";
import {} from "../../utils/encipher";
import { IUser, Role, Site, User } from "../../model";
import { Request, Response } from "express";
import generateVerificationCode from "../../utils/generateVerificationCode";
import storeVerificationCode from "../../utils/storeVerificationCode";
import sendVerificationEmail from "../../utils/sendVerificationEmail";
import redisClient from "../../config/redis";
import { AuthenticatedRequest } from "../type";

export const register = async (req: Request, res: Response) => {
  const { username, email, password, auth_code } = req.body;
  console.log(username);

  // 1. 验证输入
  const flag = validateInput(username, email, password, auth_code);
  if (!flag.valid) {
    return res.send({ code: 1, message: "Error: " + flag.message });
  }
  const storedCode = await redisClient.get(`verificationCode:${email}`); // 获取存储的验证码

  if (!storedCode) {
    return res
      .status(400)
      .json({ message: "验证码已过期或不存在，请重新请求验证码" });
  }

  if (!storedCode === auth_code)
    return res.status(400).json({ message: "验证码错误，请重新输入" });

  // 2. 检查是否已初始化
  const userCount = await User.countDocuments();
  const isSuperAdmin = userCount === 0;
  // 3. 创建 `superAdmin` 角色（如果 Role 表为空）
  const superAdminRole = await Role.findOne({ name: "superAdmin" });
  const userRole = await Role.findOne({ name: "user" });
  // 4. 加密密码（异步处理）
  const hashedPassword = await bcrypt.encryptin(password);

  // 5. 创建 `superAdmin` 用户
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role: isSuperAdmin ? superAdminRole?._id : userRole?._id, // 绑定 superAdmin 角色
  });

  await user.save();

  return res.send({
    code: 0,
    message: "Success: 注册成功请登陆！",
  });
};
export const mailValidation = async (req: Request, res: Response) => {
  const { email } = req.query; // 获取请求中的邮箱地址

  if (!email) {
    return res.status(400).json({ code: 1, message: "邮箱地址不能为空" });
  }

  try {
    const code = generateVerificationCode(); // 生成验证码
    await storeVerificationCode(email as string, code); // 存储到 Redis
    await sendVerificationEmail(email as string, code); // 发送邮件

    res.status(200).json({ code: 0, message: "验证码已发送，请检查您的邮箱" });
  } catch (error) {
    console.error("❌ 发送验证码失败:", error);
    res.status(500).json({ code: 1, message: "发送验证码失败，请稍后重试" });
  }
};
// 查询系统是否初始化
export const checkSystemInitialized = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  ///逻辑错误 toodo
  //分站查询是否注册此站点
  const subdomain = req.subdomain;
  //主站
  // if (subdomain== !null){

  // }else{

  // }
  // const Count = await Site.countDocuments({ site_sub_url: getSubdomain() }); // 查询 User 表中的记录数
  // if (Count > 0) {
  //   next();
  // } else {
  //   res.status(404).json({
  //     code: 2,
  //     message: "此站点未开通！",
  //     data: { initialized: false },
  //   });
  // }
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
export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const subdomain_id = req?.subdomain_id;
  if (!email || !password) {
    return res.status(400).json({ code: 1, message: "邮箱或密码不能为空" });
  }

  const user = await User.findOne({ email }).exec();
  if (subdomain_id) {
    if (user?.managedSites.toString() !== subdomain_id?.toString()) {
      return res.status(400).json({ code: 1, message: "请到自己的站点登录" });
    }
  }

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
    { username: user.username, uid: user._id.toString() },
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
      imgurl: user.imgurl,
      username: user.username,
    },
  });
};

// 登出
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  // 清除存储在浏览器中的 JWT token
  res.clearCookie(process.env.COOKIE_NAME as string, {
    httpOnly: true,  // 确保只能通过 HTTP 请求访问
    sameSite: 'lax', // 防止 CSRF 攻击
    // secure: process.env.NODE_ENV === "production", // 如果是生产环境，应该设置为 true，确保 HTTPS 安全传输
    maxAge: 0, // 设置过期时间为 0，等于删除 cookie
  });

  // 返回登出成功的响应
  res.json({
    code: 0,
    message: "登出成功",
  });
};
//检查登陆状态
export const auth = async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies.token; // 从 Cookie 获取 token

  if (!token) {
    return res.status(200).json({
      code: 1, // 自定义状态码，表示未登录但返回 superAdmin 数据
      message: "未登录",
    });
  }

  const decoded = jwt.verify(token, "wu0427..") as { uid: string };

  // **查询用户，并联表查询 Role**
  const user = await User.findById(decoded.uid)
    .select("-password") // 不返回密码
    .populate("role", "name description permissions") // 仅获取角色的 `name` `description` `permissions`
    .populate("managedSites", "site_sub_url")
    .exec();
  if (!user) {
    return res.status(401).json({ code: 1, message: "用户不存在" });
  }

  const site = await Site.findOne({ site_sub_url: req.subdomain });
  console.log(site?._id.toString());
  console.log(user.managedSites._id.toString());
  if (site && site._id.toString() === user.managedSites._id.toString()) {
    res.json({
      code: 0,
      message: "已登录",
      data: user, // 包含角色信息
    });
  } else if (site && site._id.toString() !== user.managedSites._id.toString()) {
    res.json({
      code: 3,
      message: "请到自己的站点登录",
    });
  } else {
    res.json({
      code: 1,
      message: "未登录",
      data: {}, // 包含角色信息
    });
  }
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

//更新用户信息
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const uid = req.auth?.uid; // 从身份认证中获取用户ID
  if (!uid) {
    return res.status(401).json({ code: 1, message: "未登录" });
  }

  // 获取用户提交的更新数据
  const { username, email, oldPassword, newPassword, imgurl } = req.body;

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
  if (imgurl) user.imgurl = imgurl;

  // 5. 保存更新后的数据
  await user.save();

  res.json({ code: 0, message: "用户信息更新成功" });
};

