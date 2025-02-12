import { Response } from "express";
import { Diary, Tag, User } from "../../model";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { AuthenticatedRequest } from "../type";
dayjs.extend(utc);
export const AddDiary = async (req: AuthenticatedRequest, res: Response) => {
  
  const { title, content, tags, date, isToday = false } = req.body;
  const uid = req.auth?.uid;
  const user = await User.findById(uid)

  if (!title || !content) {
    return res.status(400).json({
      code: 1,
      message: "标题、内容为必填项",
    });
  }


  let selectedDate: dayjs.Dayjs;
  // 如果是补签
  if (isToday) {
    selectedDate = dayjs()
   console.log(selectedDate);
   
  }else{
     // 确保 date 存在
     if (!date) {
      return res.status(400).json({
        code: 1,
        message: "日期不能为空",
      });
    }
    // 解析时间戳
    if (typeof date === "string" || typeof date === "number") {
      const timestamp = Number(date); // 转换为数字
      if (isNaN(timestamp)) {
        return res.status(400).json({
          code: 1,
          message: "无效的时间戳",
        });
      }
       selectedDate = dayjs(timestamp); // 转换为本地时间（中国 UTC+8）
      console.log(selectedDate.format("YYYY-MM-DD HH:mm:ss")); // 2025-01-19 08:00:00
      
    } else {
      return res.status(400).json({
        code: 1,
        message: "无效的日期参数",
      });
    }

    // 检查日期是否有效
    if (!selectedDate.isValid()) {
      return res.status(400).json({
        code: 1,
        message: "无效的日期格式",
      });
    }
    
  }

  // 计算当天的时间范围
  const startOfDay = selectedDate.startOf("day").toDate(); // 当天 00:00:00
  const endOfDay = selectedDate.endOf("day").toDate(); // 当天 23:59:59
 

  const existingDiary = await Diary.findOne({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existingDiary) {
    return res.status(400).json({
      code: 1,
      message: "当天已发布日记，无法重复发布",
    });
  }

  const tagIds: mongoose.Types.ObjectId[] = [];
  if (tags && tags.length > 0) {
    // 遍历 tags 数组，检查并存储标签
    for (const tag of tags) {
      const existingTag = await Tag.findOne({ name: tag.name,creator:uid });

      if (!existingTag) {
        // 如果标签不存在，创建新的标签
        console.log(uid);
        console.log(user?.managedSites);
        
        const newTag = new Tag({
          name: tag.name,
          color: tag.color,
          creator:uid,
          site:user?.managedSites,
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
  const summary =
    content.length > 3 ? content.slice(0, 3) : content.slice(0, content.length);

  //获取首图
  let coverImage;
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (item.type === "image") {
      coverImage = item.props.url;
      break;
    }
  }

  // 创建新日记实例)
  const newDiary = new Diary({
    title,
    tags: tagIds,
    content,
    summary,
    coverImage,
    isRemedy:!isToday,
    creator:user?._id,
    site:user?.managedSites,
    createdAt:date || dayjs()
  });

  // 保存到数据库
  await newDiary.save();

  res.status(201).json({
    code: 0,
    message: "新增日记成功",
    data: newDiary,
  });
};

export const GetAllDiaries = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const subdomain_id = req.subdomain_id;


  // 获取分页参数
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;



  // 获取总日记数量
  const totalDiaries = await Diary.countDocuments({site:subdomain_id});

  // 获取分页数据
  const diaries = await Diary.find(
    {site:subdomain_id},
    "title coverImage tags summary createdAt updatedAt"
  )
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

export const GetDiaryById = async (
  req: AuthenticatedRequest,
  res: Response
) => {

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
    .populate("tags", "name color")
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
 const uid = req.auth?.uid;


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
  if (diary?.creator.toString() !== uid) {
    return res.status(403).json({
      code: 1,
      message: "您没有权限修改此日记",
    });
  }

  if (!diary) {
    return res.status(404).json({
      code: 1,
      message: "未找到指定的日记",
    });
  }

 const user = await User.findById(uid)
  // 如果传入了 tags，则处理标签
  const tagIds: mongoose.Types.ObjectId[] = [];
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const existingTag = await Tag.findOne({ name: tag.name,creator:uid });

      if (!existingTag) {
        // 如果标签不存在，创建新的标签
        const newTag = new Tag({
          name: tag.name,
          color: tag.color,
          creator:uid,
          site:user?.managedSites,
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
  let coverImage;
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (item.type === "image") {
      coverImage = item.props.url;
      break;
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


export const GetAllDiaryDates = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const subdomain_id = req.subdomain_id;

  const diaryDates = await Diary.find({site:subdomain_id}, "remedyAt createdAt") // 查询 remedyAt 和 createdAt
    .sort({ createdAt: -1 }) // 按创建时间倒序排列
    .lean();

  // 提取补签日期（优先使用 remedyAt，如果没有，则使用 createdAt）
  const uniqueDates = [
    ...new Set(
      diaryDates.map((diary) =>
        dayjs(diary.remedyAt || diary.createdAt) // 确保使用本地时间
          .format("YYYY-MM-DD") // 转换为正确的年月日格式
      )
    ),
  ];

  res.status(200).json({
    code: 0,
    message: "获取所有日记日期成功",
    data: uniqueDates,
  });
};

export const GetDiariesByDate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const subdomain_id = req.subdomain_id;

  // 获取前端传来的日期参数（时间戳）
  const { date } = req.query;

  // 确保 date 存在
  if (!date) {
    return res.status(400).json({
      code: 1,
      message: "日期不能为空",
    });
  }

  let selectedDate: dayjs.Dayjs;

  // 解析时间戳
  if (typeof date === "string" || typeof date === "number") {
    const timestamp = Number(date); // 转换为数字
    if (isNaN(timestamp)) {
      return res.status(400).json({
        code: 1,
        message: "无效的时间戳",
      });
    }
    selectedDate = dayjs(timestamp); // 解析为 Day.js 对象
  } else {
    return res.status(400).json({
      code: 1,
      message: "无效的日期参数",
    });
  }

  // 检查日期是否有效
  if (!selectedDate.isValid()) {
    return res.status(400).json({
      code: 1,
      message: "无效的日期格式",
    });
  }

  // 计算当天的时间范围
  const startOfDay = selectedDate.startOf("day").toDate(); // 当天 00:00:00
  const endOfDay = selectedDate.endOf("day").toDate(); // 当天 23:59:59

  const  diary = await Diary.findOne(
        { createdAt: { $gte: startOfDay, $lte: endOfDay },site:subdomain_id },
        "title coverImage tags content createdAt updatedAt"
      )
        .populate("tags", "name color") // 关联标签
        .lean();
    
 

  res.status(200).json({
    code: 0,
    message: diary ? "获取当天日记成功" : "当天无日记",
    data: diary || null,
  });
};


export const GetDiaryTimeline = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  // 查询所有日记的 _id、标题和更新时间，并按更新时间倒序排列
  const diaries = await Diary.find({site:subdomain_id}, "title createdAt")
    .sort({ createdAt: -1 }) // 按更新时间降序排列
    .lean();

  // 按年份归档
  const timeline: Record<string, { _id: string; title: string; createdAt: string }[]> = {};

  diaries.forEach((diary) => {
    const year = dayjs(diary.updatedAt).format("YYYY"); // 提取年份

    if (!timeline[year]) {
      timeline[year] = [];
    }

    timeline[year].push({
      _id: (diary._id).toString(),
      title: diary.title,
      createdAt: diary.createdAt,
    });
  });

  res.status(200).json({
    code: 0,
    message: "获取日记时间轴成功",
    data: timeline,
  });
};

