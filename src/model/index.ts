import mongoose from 'mongoose';

// 创建数据库连接
const db = mongoose.createConnection('mongodb://mongo:27017/ronBlog', {});

db.on('error', console.error.bind(console, '连接错误:'));
db.once('open', () => {
    console.log('链接数据库RonBlog成功！');
});

// 用户表接口和 Schema
export interface IUser {
    _id: mongoose.Types.ObjectId;  // 用户唯一ID
    account: string;  // 用户账户（唯一）
    username: string;  // 用户名
    password: string;  // 密码
    email: string;  // 用户邮箱（唯一）
    sex: number;  // 性别（0-未知, 1-男, 2-女）
    birthday: Date;  // 生日
    phone: number;  // 电话号码
    school: string;  // 所属学校
    explain: string;  // 个性签名（默认值：用户很懒没有个性签名）
    imgurl: string;  // 头像地址（默认值：/user/user.png）
    createdAt?: Date;  // 创建时间
    updatedAt?: Date;  // 更新时间
}

const UserSchema = new mongoose.Schema<IUser>({
    account: { type: String, unique: true, required: true }, 
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    sex: { type: Number, default: 0 },
    birthday: { type: Date },
    phone: { type: Number },
    school: { type: String },
    explain: { type: String, default: '用户很懒没有个性签名' },
    imgurl: { type: String, default: '/user/user.png' },
}, { timestamps: true });  // 自动添加 createdAt 和 updatedAt 字段

// 文件夹表接口和 Schema
export interface IFolder {
    _id: mongoose.Types.ObjectId;  // 文件夹唯一ID
    name: string;  // 文件夹名称
    parentFolder?: mongoose.Types.ObjectId;  // 父文件夹ID，根目录为空（null）
    createdBy?: mongoose.Types.ObjectId;  // 文件夹创建者（用户ID）
    desc?:string
    order: number;  // 文件夹排序字段，较小的值优先展示
    createdAt?: Date;  // 创建时间
    updatedAt?: Date;  // 更新时间
}

const FolderSchema = new mongoose.Schema<IFolder>({
    name: { type: String, required: true },  // 文件夹名称
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },  // 父文件夹引用
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // 创建者用户
    desc:{type:String},
    order: { type: Number, default: 0 },  // 排序字段
}, { timestamps: true });

// 文章表接口和 Schema（单独定义用于文章）
export interface IArticle {
    _id: mongoose.Types.ObjectId;  // 文章唯一ID
    title: string;  // 文章标题
    content: unknown;  // 文章内容
    author: mongoose.Types.ObjectId;  // 文章作者（用户ID）
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },  // 必填，所属文件夹
    order: number;  // 文章排序字段
    createdAt?: Date;  // 创建时间
    updatedAt?: Date;  // 更新时间
}

const ArticleSchema = new mongoose.Schema<IArticle>({
    title: { type: String, required: true },  // 文章标题
    content: { type: Array, required: true },  // 文章内容
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // 文章作者（用户ID）
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },  // 文章所属文件夹
    order: { type: Number, default: 0 },  // 排序字段
}, { timestamps: true });


// 创建模型
const User = db.model<IUser>('User', UserSchema);
const Folder = db.model<IFolder>('Folder', FolderSchema);
const Article = db.model<IArticle>('Article', ArticleSchema);

export { User, Folder, Article };
export default db;
