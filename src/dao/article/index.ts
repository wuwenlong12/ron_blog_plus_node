import { Response } from "express";
import { AuthenticatedRequest } from "./type";
import db, { IArticle} from "../../model";


export const GetArticleInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.query;

  // 查找单个文章的信息
  const Article = db.model("Article");
  if (id) {
    const item = await Article.findById(id).populate('tags', 'name color').lean()
    console.log(item);
    
    // console.log("序列化前的数据：", item.content[0].content);
  const data = JSON.parse(customStringify(item)) 
    
    
    // 发送已处理的完整数据，避免 Express 重新序列化
    return res.status(200).send({
      // test:item.content[0].content,
      code: 0,
      message: "查找文章内容成功",
      data
    });
  }
};

function customStringify(obj) {
  // 递归处理函数
  function replaceUndefined(value) {
    if (Array.isArray(value)) {
      return value.map(replaceUndefined);
    } else if (value !== null && typeof value === "object") {
      // 如果对象有 _id 字段，转换为字符串
      if (value._id) {
        value = { ...value, _id: value._id.toString() }; // 创建一个新对象，转换 _id
      }
      if (value.parentFolder) {
        value = { ...value, parentFolder: value.parentFolder.toString() }; // 创建一个新对象，转换 _id
      }
      
      // 遍历对象的所有键值对
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => {
          // 处理 undefined 为 null
          return [key, val === undefined ? null : replaceUndefined(val)];
        })
      );
    }
    return value;
  }

  // 替换 undefined 为 null，并返回 JSON 字符串
  return JSON.stringify(replaceUndefined(obj));
}
// 更新文章内容接口
export const UpdateArticleContent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Article = db.model("Article");
  const { id, content } = req.body;

  
  if (!id || !content) {
    return res.status(400).json({ code: 1, message: "文章 ID 或内容不能为空" });
  }

  // 查找文章
  const article = await Article.findOne({ _id: id});

  if (!article) {
    return res.status(404).json({ code: 1, message: "文章不存在" });
  }

  // 更新文章内容
  article.content = content;
  await article.save();

  res.status(200).json({
    code: 0,
    message: "文章内容更新成功",
    article,
  });
};

