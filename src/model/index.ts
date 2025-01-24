import mongoose from "mongoose";
import "dotenv-flow/config";
// 创建数据库连接
// const db = mongoose.createConnection('mongodb://mongo:27017/ronBlog', {});
const db = mongoose.createConnection(process.env.MONGO_URL as string);
console.log(process.env.MONGO_URL);

db.on("error", console.error.bind(console, "连接错误:"));
db.once("open", () => {
  console.log("链接数据库RonBlog成功！");
});

// 用户表接口和 Schema
export interface IUser {
  _id: mongoose.Types.ObjectId; // 用户唯一ID
  role: mongoose.Types.ObjectId; // 角色 ID，引用 Role 表
  username: string; // 用户名
  password: string; // 密码
  email: string; // 用户邮箱（唯一）
  phone: number; // 电话号码
  wx: string; //微信
  github: string; //github地址
  school: string; // 所属学校
  explain: Array<unknown>; // 个性签名（默认值：用户很懒没有个性签名）
  imgurl: string; // 头像地址（默认值：/user/user.png）
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, // 关联 Role
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number },
    wx: { type: String },
    github: { type: String },
    school: { type: String },
    explain: { type: Array, default: ["用户很懒没有个性签名"] },
    imgurl: { type: String },
  },
  { timestamps: true }
); // 自动添加 createdAt 和 updatedAt 字段

//角色表
export interface IRole {
  _id: mongoose.Types.ObjectId;
  name: string; // 角色名称（如 admin、editor、author、visitor）
  permissions: string[]; // 角色权限（如 ["CREATE_ARTICLE", "DELETE_USER"]）
  createdAt?: Date;
  updatedAt?: Date;
}

// 角色 Schema
const RoleSchema = new mongoose.Schema<IRole>(
  {
    name: { type: String, required: true, unique: true }, // 角色名称唯一
    permissions: { type: [String], default: [] }, // 权限列表
  },
  { timestamps: true }
);

// 文件夹表接口和 Schema
export interface IFolder {
  _id: mongoose.Types.ObjectId; // 文件夹唯一ID
  name: string; // 文件夹名称
  parentFolder?: mongoose.Types.ObjectId; // 父文件夹ID，根目录为空（null）
  createdBy?: mongoose.Types.ObjectId; // 文件夹创建者（用户ID）
  desc?: string;
  order: number; // 文件夹排序字段，较小的值优先展示
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const FolderSchema = new mongoose.Schema<IFolder>(
  {
    name: { type: String, required: true }, // 文件夹名称
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, // 父文件夹引用
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 创建者用户
    desc: { type: String },
    order: { type: Number, default: 0 }, // 排序字段
  },
  { timestamps: true }
);

// 文章表接口和 Schema（单独定义用于文章）
export interface IArticle {
  _id: mongoose.Types.ObjectId; // 文章唯一ID
  title: string; // 文章标题
  content: Array<unknown>; // 文章内容
  summary: Array<unknown>; // 文章内容
  author: mongoose.Types.ObjectId; // 文章作者（用户ID）
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId;
    ref: "Folder";
    required: true;
  }; // 必填，所属文件夹
  tags: mongoose.Types.ObjectId[]; // 新增字段，存储关联的标签 ID
  order: number; // 文章排序字段
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const ArticleSchema = new mongoose.Schema<IArticle>(
  {
    title: { type: String, required: true }, // 文章标题
    content: { type: Array, required: true }, // 文章内容
    summary: { type: Array, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 文章作者（用户ID）
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, // 文章所属文件夹
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag", default: [] }], // 默认空数组
    order: { type: Number, default: 0 }, // 排序字段
  },
  { timestamps: true, minimize: false }
);

// 标签表接口和 Schema
export interface ITag {
  _id: mongoose.Types.ObjectId; // 标签唯一ID
  name: string; // 标签名称
  color: string;
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const TagSchema = new mongoose.Schema<ITag>(
  {
    name: { type: String, unique: true, required: true }, // 标签名称（唯一且必填）
    color: { type: String, required: false },
  },
  { timestamps: true }
); // 自动添加 createdAt 和 updatedAt 字段

export interface IDiary {
  _id: mongoose.Types.ObjectId; // 日记唯一ID
  isRemedy: boolean;
  remedyAt?: Date;
  title: string; // 日记标题
  content: Array<unknown>; // 日记内容
  tags: mongoose.Types.ObjectId[]; // 新增字段，存储关联的标签 ID
  summary: Array<unknown>; // 文章内容
  coverImage?: string; // 主图URL
  // author: mongoose.Types.ObjectId; // 日记作者（用户ID）
  // isPublic: boolean; // 是否公开
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const DiarySchema = new mongoose.Schema<IDiary>(
  {
    isRemedy: { type: Boolean, required: true },
    remedyAt: { type: Date, required: false },
    title: { type: String, required: true }, // 日记标题，必填
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag", default: [] }], // 默认空数组
    content: { type: Array, required: true }, // 日记内容，必填
    summary: { type: Array, required: true },
    coverImage: { type: String, required: false }, // 主图URL，必填
    // author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 日记作者
    // isPublic: { type: Boolean, default: false }, // 是否公开，默认私密
  },
  { timestamps: true, minimize: false }
); // 自动生成 createdAt 和 updatedAt 字段

// 首页轮播图表接口和 Schema
export interface ICarousel {
  _id: mongoose.Types.ObjectId; // 轮播图唯一ID
  title: string; // 轮播图标题
  subtitle: string; // 轮播图副标题
  desc: string; // 轮播图描述
  img_url: string;
  buttons: {
    // 按钮数组
    color: string; // 按钮颜色
    text: string; // 按钮文本
    url: string; // 按钮跳转链接
  }[];
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const CarouselSchema = new mongoose.Schema<ICarousel>(
  {
    title: { type: String, required: true }, // 轮播图标题
    subtitle: { type: String, required: true }, // 轮播图副标题
    desc: { type: String, required: true }, // 轮播图描述
    img_url: { type: String }, // 轮播图描述
    buttons: [
      {
        // 按钮数组
        color: { type: String, required: true }, // 按钮颜色
        text: { type: String, required: true }, // 按钮文本
        url: { type: String, required: true }, // 按钮链接
      },
    ],
  },
  { timestamps: true }
); // 自动添加 createdAt 和 updatedAt 字段


// 项目列表接口和 Schema
export interface IProject {
  _id: mongoose.Types.ObjectId; // 项目唯一ID
  title: string; // 项目标题
  img_url?: string; // 项目封面图片
  category: string; // 项目分类
  likes: number; // 点赞数
  button_url: string; // 按钮跳转链接
  content: Array<unknown>; // 项目内容
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

const ProjectSchema = new mongoose.Schema<IProject>(
  {
    title: { type: String, required: true }, // 项目标题
    img_url: { type: String }, // 项目封面图片
    category: { type: String, required: true }, // 项目分类
    likes: { type: Number, default: 0 }, // 点赞数，默认为 0
    button_url: { type: String, required: true }, // 按钮跳转链接
    content: { type: Array, required: true }, // 项目内容
  },
  { timestamps: true }
); // 自动添加 createdAt 和 updatedAt 字段。
// 创建模型
const User = db.model<IUser>("User", UserSchema);
const Role = db.model<IRole>("Role", RoleSchema);
const Folder = db.model<IFolder>("Folder", FolderSchema);
const Article = db.model<IArticle>("Article", ArticleSchema);
const Tag = db.model<ITag>("Tag", TagSchema);
const Diary = db.model<IDiary>("Diary", DiarySchema);
const Carousel = db.model<ICarousel>("Carousel", CarouselSchema);
const Project = db.model<IProject>("Project", ProjectSchema);

export { User, Role, Folder, Article, Tag, Diary, Carousel,Project };
export default db;
