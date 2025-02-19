import { Response } from "express";
import { Tag, User } from "../../model";
import { AuthenticatedRequest } from "../type";

export const AddNewTag = async (req: AuthenticatedRequest, res: Response) => {
  const { name,color } = req.body;
  const uid = req.auth?.uid;
  if (!name) {
    return res.status(400).json({ code: 1, message: "标签名称不能为空" });
  }

  const user = await User.findOne({ _id: uid });
  if (!user) {
    return res.status(400).json({ code: 1, message: "用户不存在" });
  }
  const existingTag = await Tag.findOne({
    name,
    creator: uid,
    site: user.managedSites,
  });

  if (existingTag) {
    return res.status(409).json({ code: 1, message: "标签已存在" });
  }

  const newTag = new Tag({ name, creator: uid, site: user.managedSites,color });
  await newTag.save();

  return res.status(201).json({
    code: 0,
    message: "标签创建成功",
    data: newTag,
  });
};

export const GetAllTags = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  
  if (!subdomain_id) {
    return res.status(400).json({
      code: 1,
      message: "站点ID不能为空"
    });
  }

  try {
    const tags = await Tag.find({ site: subdomain_id })
      .select('name color _id')  // 只返回需要的字段
      .sort({ createdAt: -1 });  // 按创建时间倒序

    return res.status(200).json({
      code: 0,
      data: tags,
      message: "获取标签列表成功"
    });
  } catch (error) {
    return res.status(500).json({
      code: 1,
      message: "获取标签列表失败",
      error: error instanceof Error ? error.message : "未知错误"
    });
  }
};

export const DeleteTag = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.query;
  const uid = req.auth?.uid;
  const tag = await Tag.findOne({ _id: id });
  if (uid !== tag?.creator.toString()) {
    return res.status(401).json({ code: 1, message: "没有权限删除此标签" });
  }
  const deletedTag = await Tag.findByIdAndDelete(id);

  if (!deletedTag) {
    return res.status(404).json({ code: 1, message: "标签未找到" });
  }

  return res.status(200).json({
    code: 0,
    message: "标签删除成功",
    data: deletedTag,
  });
};
