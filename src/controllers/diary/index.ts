import { Response } from "express";
import { AuthenticatedRequest } from "./type";
import db, { Tag } from "../../model";
import mongoose, { ObjectId } from "mongoose";


export const AddDiary = async (req: AuthenticatedRequest, res: Response) => {
  const Diary = db.model("Diary");

  // 从请求体中获取字段
  // const { title, content, coverImage, tags, isPublic } = req.body;
  const { title, content,tags } = req.body;
  if (!title || !content ) {
    return res.status(400).json({
      code: 1,
      message: "标题、内容和为必填项",
    });
  }
  const tagIds: mongoose.Types.ObjectId[] = [];
  if (tags && tags.length > 0) {
    // 遍历 tags 数组，检查并存储标签
    for (const tag of tags) {
      const existingTag = await Tag.findOne({ name: tag.name });

      if (!existingTag) {
        // 如果标签不存在，创建新的标签
        const newTag = new Tag({
          name: tag.name,
          color: tag.color,
        });
        await newTag.save();
        tagIds.push(newTag._id);
      } else {
        // 如果标签已存在，直接使用该标签的 ID
        tagIds.push(existingTag._id);
      }
    }
  }
  // 获取摘要
  const summary =content.length >3?content.slice(0,3):content.slice(0,content.length)

  //获取首图
  let coverImage 
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if ( item.type === "image") {
      coverImage = item.props.url
      break
    }
  }
  // 创建新日记实例)
  const newDiary = new Diary({
    title,
    tags:tagIds,
    content,
    summary,
    coverImage,
  
    // author: req.auth._id, // 使用当前登录用户的 ID
    // tags: tags || [], // 默认空数组
    // isPublic: isPublic || false, // 默认私密
  });

  // 保存到数据库
  await newDiary.save();

  res.status(201).json({
    code: 0,
    message: "新增日记成功",
    data: newDiary,
  });
};

export const GetAllDiaries = async (req: AuthenticatedRequest, res: Response) => {
  const Diary = db.model("Diary");

  // 获取分页参数
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  // // 查询条件（示例：仅返回公开日记）
  // const query = { isPublic: true };

  // 获取总日记数量
  const totalDiaries = await Diary.countDocuments();

  // 获取分页数据
  const diaries = await Diary.find({},"title coverImage tags summary createdAt updatedAt")
    // .populate("author", "username email") // 关联作者信息
     .populate("tags", "name color") // 关联作者信息
    .sort({ createdAt: -1 }) // 按创建时间倒序
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  // 返回响应
  res.status(200).json({
    code: 0,
    message: "获取日记成功",
    data: {
      diaries,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        total: totalDiaries,
        totalPages: Math.ceil(totalDiaries / pageSize),
      },
    },
  });
};


export const GetDiaryById = async (req: AuthenticatedRequest, res: Response) => {
  const Diary = db.model("Diary");

  // 从请求参数中获取日记 ID
  const { id } = req.query;

  // 检查 ID 是否提供
  if (!id) {
    return res.status(400).json({
      code: 1,
      message: "日记 ID 不能为空",
    });
  }

  // 查找日记
  const diary = await Diary.findById(id)
  .populate("tags","name color")
    .select("title content coverImage summary tags createdAt updatedAt") // 限制返回字段
    .lean();

  // 检查日记是否存在
  if (!diary) {
    return res.status(404).json({
      code: 1,
      message: "未找到指定的日记",
    });
  }

  // 返回成功响应
  res.status(200).json({
    code: 0,
    message: "获取日记成功",
    data: diary,
  });
};

export const UpdateDiary = async (req: AuthenticatedRequest, res: Response) => {
  const Diary = db.model("Diary");

  // 从请求体中获取字段
  const { id, title, content, tags } = req.body;

  // 检查必要字段
  if (!id) {
    return res.status(400).json({
      code: 1,
      message: "日记 ID 不能为空",
    });
  }

  // 检查 ID 是否有效
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      code: 1,
      message: "无效的日记 ID",
    });
  }

  // 查找要更新的日记
  const diary = await Diary.findById(id);

  if (!diary) {
    return res.status(404).json({
      code: 1,
      message: "未找到指定的日记",
    });
  }

  // 如果传入了 tags，则处理标签
  const tagIds: mongoose.Types.ObjectId[] = [];
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const existingTag = await Tag.findOne({ name: tag.name });

      if (!existingTag) {
        // 如果标签不存在，创建新的标签
        const newTag = new Tag({
          name: tag.name,
          color: tag.color,
        });
        await newTag.save();
        tagIds.push(newTag._id);
      } else {
        // 如果标签已存在，直接使用该标签的 ID
        tagIds.push(existingTag._id);
      }
    }
  }

  // 更新日记的字段
  if (title) diary.title = title;
  if (content) diary.content = content;
  if (tags) diary.tags = tagIds;
  let coverImage 
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if ( item.type === "image") {
      coverImage = item.props.url
      break
    }
  }
  if (coverImage) diary.coverImage = coverImage;
  // 保存修改
  await diary.save();

  // 返回成功响应
  res.status(200).json({
    code: 0,
    message: "日记更新成功",
    data: diary,
  });
};

export const GetAllDiaryDates = async (req: AuthenticatedRequest, res: Response) => {
  const Diary = db.model("Diary");

  const diaryDates = await Diary.find({}, "createdAt")
    .sort({ createdAt: -1 }) // 按创建时间倒序排列
    .lean();

  // 提取日期并去重
  const uniqueDates = [
    ...new Set(diaryDates.map(diary => new Date(diary.createdAt).toISOString().split("T")[0]))
  ];

  res.status(200).json({
    code: 0,
    message: "获取所有日记日期成功",
    data: uniqueDates,
  });
};