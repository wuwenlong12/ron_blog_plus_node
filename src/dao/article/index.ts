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
    const item = await Article.findById(id);
    console.log("序列化前的数据：", item.content[0].content);
    
    // 发送已处理的完整数据，避免 Express 重新序列化
    return res.status(200).json({
      test:item.content[0].content,
      code: 0,
      message: "查找文章内容成功",
      data: item
    });
  }
};

// 更新文章内容接口
export const UpdateArticleContent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Article = db.model("Article");
  const { id, content } = req.body;
  console.log(content[0].content);
  
  if (!id || !content) {
    return res.status(400).json({ code: 1, message: "文章 ID 或内容不能为空" });
  }

  // 查找文章
  const article = await Article.findOne({ _id: id});
console.log();

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

