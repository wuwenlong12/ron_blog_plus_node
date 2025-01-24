import jwt from "jsonwebtoken";
import * as bcrypt from "../../utils/bcrypt";
import { validateInput } from "../../utils/reg";
import {} from "../../utils/encipher";
import  { IUser, Role, User } from "../../model";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "./type";



export const init = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // 1. 验证输入
  const flag = validateInput(username, email, password);
  if (!flag.valid) {
    return res.send({ code: 1, message: "Error: " + flag.message, data: {} });
  }

  // 2. 检查是否已初始化
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return res.send({
      code: 1,
      message: "Error: 系统已初始化，不能重复初始化",
      data: {},
    });
  }

  // 3. 创建 `superAdmin` 角色（如果 Role 表为空）
  let superAdminRole = await Role.findOne({ name: "superAdmin" });

  if (!superAdminRole) {
    superAdminRole = new Role({
      name: "superAdmin",
      description: "超级管理员，拥有所有权限",
      permissions: ["ALL"], // 超级管理员拥有所有权限
    });
    await superAdminRole.save();
  }

  // 4. 加密密码（异步处理）
  const hashedPassword = await bcrypt.encryptin(password);

  // 5. 创建 `superAdmin` 用户
  const user = new User({
    username,
    email,
    password: hashedPassword,
    role: superAdminRole._id, // 绑定 superAdmin 角色
  });

  await user.save();

  return res.send({
    code: 0,
    message: "Success: 初始化完成，超级管理员账号已创建",
    data: {},
  });
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

//检查登陆状态
export const auth = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.cookies.token; // 从 Cookie 获取 token
    if (!token) {
        // **未登录时，查询超级管理员信息**
        const superAdmin = await User.findOne({ role: await Role.findOne({ name: "superAdmin" }).select("_id") })
          .select("_id username email explain") // 不返回密码
          .exec();
    
        if (!superAdmin) {
          return res.status(404).json({ code: 2, message: "未找到信息" });
        }
    
        return res.status(200).json({
          code: 1, // 自定义状态码，表示未登录但返回 superAdmin 数据
          message: "未登录",
          data: superAdmin,
        });
      }
    try {
      const decoded = jwt.verify(token, "wu0427..") as { uid: string };
  
      // **查询用户，并联表查询 Role**
      const user = await User.findById(decoded.uid)
        .select("-password") // 不返回密码
        .populate("role", "name description permissions") // 仅获取角色的 `name` `description` `permissions`
        .exec();
  
      if (!user) {
        return res.status(401).json({ code: 1, message: "用户不存在" });
      }
  
      res.json({
        code: 0,
        message: "已登录",
        data: user, // 包含角色信息
      });
    } catch (error) {
      return res.status(401).json({ code: 1, message: "Token 无效" });
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

  res.json({ code: 0, message: "用户信息更新成功" });
};
