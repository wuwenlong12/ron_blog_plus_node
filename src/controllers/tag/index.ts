import { Response } from "express";
import { AuthenticatedRequest } from "./type";
import { Tag } from "../../model";

export const AddNewTag = async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ code:1,message: "标签名称不能为空" });
  }

 
  const existingTag = await Tag.findOne({ name });

  if (existingTag) {
    return res.status(409).json({ code:1,message: "标签已存在" });
  }

  const newTag = new Tag({ name });
  await newTag.save();

  return res.status(201).json({
    code:0,
    message: "标签创建成功",
    data: newTag,
  });
};

export const GetAllTags = async (req: AuthenticatedRequest, res: Response) => {
 
  const tags = await Tag.find();

  return res.status(200).json({
    code:0,
    message: "标签列表获取成功",
    data: tags,
  });
};

export const DeleteTag = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.query;
  console.log(id);
  
 
  const deletedTag = await Tag.findByIdAndDelete(id);

  if (!deletedTag) {
    return res.status(404).json({code:1, message: "标签未找到" });
  }

  return res.status(200).json({
    code:0,
    message: "标签删除成功",
    data: deletedTag,
  });
};