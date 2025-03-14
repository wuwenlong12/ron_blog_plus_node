import mongoose from "mongoose";
// 用户表接口和 Schema
export interface IUser {
  _id: mongoose.Types.ObjectId; // 用户唯一ID
  role: mongoose.Types.ObjectId; // 角色 ID，引用 Role 表
  username: string; // 用户名
  password: string; // 密码
  email: string; // 用户邮箱（唯一）
  imgurl: string; // 头像地址（默认值：/user/user.png）
  managedSites: mongoose.Types.ObjectId
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, // 关联 Role
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    imgurl: { type: String },
    managedSites: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' }, // 关联站点表
  },
  { timestamps: true }
); // 自动添加 createdAt 和 updatedAt 字段

//角色表
export interface IRole {
  _id: mongoose.Types.ObjectId;
  name: string; // 角色名称（如 admin、editor、author、visitor）
  permissions: string[]; // 角色权限（如 ["CREATE_ARTICLE", "DELETE_USER"]）
  createdAt: Date;
  updatedAt: Date;
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
  site: mongoose.Types.ObjectId; // 文件夹所属站点
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const FolderSchema = new mongoose.Schema<IFolder>(
  {
    name: { type: String, required: true }, // 文件夹名称
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, // 父文件夹引用
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 创建者用户
    desc: { type: String },
    order: { type: Number, default: 0 }, // 排序字段
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 文件夹所属站点
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
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
  site: mongoose.Types.ObjectId; // 文章所属站点
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId;
    ref: "Folder";
    required: true;
  }; // 必填，所属文件夹
  tags: mongoose.Types.ObjectId[]; // 新增字段，存储关联的标签 ID
  order: number; // 文章排序字段
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const ArticleSchema = new mongoose.Schema<IArticle>(
  {
    title: { type: String, required: true }, // 文章标题
    content: { type: Array, required: true }, // 文章内容
    summary: { type: Array, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 文章作者（用户ID）
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, // 文章所属文件夹
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 文章所属站点
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag", default: [] }], // 默认空数组
    order: { type: Number, default: 0 }, // 排序字段
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
  },
  { timestamps: true, minimize: false }
);

// 标签表接口和 Schema
export interface ITag {
  _id: mongoose.Types.ObjectId; // 标签唯一ID
  name: string; // 标签名称
  color: string;
  site: mongoose.Types.ObjectId; // 标签所属站点
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const TagSchema = new mongoose.Schema<ITag>(
  {
    name: { type: String, unique: true, required: true }, // 标签名称（唯一且必填）
    color: { type: String, required: false },
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 标签所属站点
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
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
  site: mongoose.Types.ObjectId; // 日记所属站点
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
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
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 日记所属站点
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
  site: mongoose.Types.ObjectId; // 轮播图所属站点
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  buttons: {
    // 按钮数组
    color: string; // 按钮颜色
    text: string; // 按钮文本
    url: string; // 按钮跳转链接
  }[];
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const CarouselSchema = new mongoose.Schema<ICarousel>(
  {
    title: { type: String, required: true }, // 轮播图标题
    subtitle: { type: String, required: true }, // 轮播图副标题
    desc: { type: String, required: true }, // 轮播图描述
    img_url: { type: String }, // 轮播图描述
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 轮播图所属站点
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
  site: mongoose.Types.ObjectId; // 项目所属站点
  title: string; // 项目标题
  img_url?: string; // 项目封面图片
  category: string; // 项目分类
  likes: number; // 点赞数
  button_url: string; // 按钮跳转链接
  content: Array<unknown>; // 项目内容
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const ProjectSchema = new mongoose.Schema<IProject>(
  {
    title: { type: String, required: true }, // 项目标题
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true }, // 项目所属站点
    img_url: { type: String }, // 项目封面图片
    category: { type: String, required: true }, // 项目分类
    likes: { type: Number, default: 0 }, // 点赞数，默认为 0
    button_url: { type: String, required: true }, // 按钮跳转链接
    content: { type: Array, required: true }, // 项目内容
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 创建人（用户ID）
  },
  { timestamps: true, minimize: false }
); // 自动添加 createdAt 和 updatedAt 字段。

// 定义 About 页面 Schema
export interface ISite {
  site_sub_url:string; //网站二级域名
  site_name:string; //网站名字
  is_core:boolean; //是否为主站
  is_pass:boolean; //是否通过审核
  is_off:false; //是否封停
  avatar: string; // 头像 URL
  name: string; // 姓名
  signatures: string[]; // 关于页面的个性签名数组
  homepage_signature: [string]; // 首页个性签名
  tech_stack: string[]; // 技术栈数组
  wechat?: string; // 微信号（可选）
  github: string; // GitHub 地址
  email: string; // 邮箱地址
  profession: string; // 职业
  pageView: number; // 总页面浏览量
  todayPageView: number; // 今日页面浏览量
  card_signature: string; // Card 名片个性签名
  card_message: string; // Card 背面留言
  creator: mongoose.Types.ObjectId; // 创建人（用户ID）
  AboutContent:Array<unknown>; // 关于页面内容
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

// Mongoose Schema 定义
const SiteSchema = new mongoose.Schema<ISite>(
  {
    site_sub_url :{type: String,required: true,unique:true},
    site_name:{type: String,required: true},
    is_core:{type: Boolean,default:false}, //是否为主站
    is_pass:{type: Boolean,default:false}, //是否通过审核
    is_off:{type: Boolean,default:false}, //是否封停
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 关联 User 表
    name: { type: String, required: true }, // 姓名
    avatar: { type: String, }, // 头像
    signatures: { type: [String],default:['站长很懒，没有留下什么']}, // 个性签名数组
    homepage_signature: { type: [String],default:['站长很懒，没有留下什么']}, // 首页个性签名
    tech_stack: { type: [String],default:['HTML','CSS','JS'] }, // 技术栈数组
    wechat: { type: String }, // 微信号（可选）
    github: { type: String }, // GitHub 地址
    email: { type: String}, // 邮箱地址
    profession: { type: String}, // 职业
    pageView: { type: Number, default: 0 }, // 总页面浏览量
    todayPageView: { type: Number, default: 0 }, // 今日页面浏览量
    card_signature: { type: String, default:'站长很懒，没有设置'}, // Card 名片个性签名
    card_message: { type: String, default:'站长很懒，没有设置' }, // Card 背面留言
    AboutContent: { type: Array}, // 关于页面内容
  },
  { timestamps: true, minimize: false } // 自动生成 createdAt 和 updatedAt
);

// 访问记录表接口
export interface IVisit {
  _id: mongoose.Types.ObjectId;
  site: mongoose.Types.ObjectId;  // 关联的站点
  ip: string;                     // 访问者IP
  userAgent: string;              // 浏览器信息
  path: string;                   // 访问路径
  referer?: string;              // 来源页面
  date: Date;                    // 访问日期（年月日）
  createdAt: Date;               // 具体访问时间
  updatedAt: Date;
}

// 访问记录 Schema
const VisitSchema = new mongoose.Schema<IVisit>(
  {
    site: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Site", 
      required: true 
    },
    ip: { 
      type: String, 
      required: true 
    },
    userAgent: { 
      type: String, 
      required: true 
    },
    path: { 
      type: String, 
      required: true 
    },
    referer: { 
      type: String 
    },
    date: { 
      type: Date, 
      required: true,
      index: true  // 添加索引以优化查询性能
    }
  },
  { 
    timestamps: true,
    // 添加复合索引以优化常用查询
    indexes: [
      { site: 1, date: -1 },  // 用于按站点和日期查询
      { site: 1, ip: 1, date: 1 }  // 用于统计独立访客
    ]
  }
);


// 文件表 Schema
export interface IFile {
  _id: mongoose.Types.ObjectId; // 轮播图唯一ID
  name: string; // 文件名
  hash: string; // 文件hash
  size: number; // 文件大小
  type: string; // 文件类型
  path: string; // 文件路径
  is_over:boolean; // 是否完成上传
  totalChunks:number; // 分片总数
  chunkIndex:number; // 分片索引
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
}

const FileSchema = new mongoose.Schema<IFile>(
  {
    name: { type: String, required: true }, // 文件名
    hash: { type: String, required: true }, // 文件hash
    size: { type: Number, required: true }, // 文件大小
    type: { type: String, required: true }, // 文件类型
    path: { type: String }, // 文件路径
    is_over: { type: Boolean, default: false }, // 是否完成上传
    totalChunks: { type: Number, default: 0 }, // 分片总数
    chunkIndex: { type: Number, default: 0 }, // 分片索引
  },
  { timestamps: true }
); 


// 创建模型
const User = mongoose.model<IUser>("User", UserSchema);
const Role = mongoose.model<IRole>("Role", RoleSchema);
const Folder = mongoose.model<IFolder>("Folder", FolderSchema);
const Article = mongoose.model<IArticle>("Article", ArticleSchema);
const Tag = mongoose.model<ITag>("Tag", TagSchema);
const Diary = mongoose.model<IDiary>("Diary", DiarySchema);
const Carousel = mongoose.model<ICarousel>("Carousel", CarouselSchema);
const Project = mongoose.model<IProject>("Project", ProjectSchema);
const Site = mongoose.model<ISite>("Site", SiteSchema);
const Visit = mongoose.model<IVisit>("Visit", VisitSchema);
const File = mongoose.model<IFile>("File", FileSchema);
export { User, Role, Folder, Article, Tag, Diary, Carousel,Project,Site,Visit,File };
