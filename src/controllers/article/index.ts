import { Response } from "express";
import { AuthenticatedRequest } from "./type";
import db, { IArticle } from "../../model";


export const GetArticleInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.query;

  // 查找单个文章的信息
  const Article = db.model("Article");
  if (id) {
    const data = await Article.findById(id)
      .populate("tags", "name color")
      .lean();

    return res.status(200).send({
      code: 0,
      message: "查找文章内容成功",
      data,
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

  if (!id || !content) {
    return res.status(400).json({ code: 1, message: "文章 ID 或内容不能为空" });
  }

  // 查找文章
  const article = await Article.findOne({ _id: id });

  if (!article) {
    return res.status(404).json({ code: 1, message: "文章不存在" });
  }

  // 更新文章内容
  article.content = content;
  //展示首页的内容
  article.summary = content.length >3?content.slice(0,3):content.slice(0,-1)
  console.log(article.summary);
  
  await article.save();

  res.status(200).json({
    code: 0,
    message: "文章内容更新成功",
    article,
  });
};

export const GetAllArticlesInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Article = db.model("Article");

  // 获取所有文章的标题和更新时间，按更新时间降序排序
  const articles = await Article.find({}, "title updatedAt")
    .sort({ updatedAt: -1 }) // 按更新时间降序排序
    .lean();

  // 按年份分类
  const articlesByYear = articles.reduce((acc: Record<string, any[]>, article) => {
    const year = new Date(article.updatedAt).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push({
      _id:article._id,
      title: article.title,
      updatedAt: article.updatedAt,
    });
    return acc;
  }, {});

  res.status(200).json({
    code: 0,
    message: "按年份分类获取文章成功",
    data: articlesByYear,
  });
};

// 分页获取文章接口
export const GetPaginatedArticles = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Article = db.model("Article");

  // 获取分页参数
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  const limitNumber = parseInt(req.query.limitNumber as string) || 10;

  // 查询文章并处理数据
  const articles: IArticle[] = await Article.find({}, "title summary createdAt updatedAt tags content")
    .populate("tags", "name color")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .lean<IArticle[]>();

  const totalArticles = await Article.countDocuments();

 

  res.status(200).json({
    code: 0,
    message: "获取分页文章成功",
    data: {
      articles: articles,
      pagination: {
        currentPage: pageNumber,
        pageSize: limitNumber,
        total: totalArticles,
      },
    },
  });
};