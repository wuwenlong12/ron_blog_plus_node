import { Request, Response } from "express";
import { AuthenticatedRequest } from "./type";
import { Carousel, Project } from "../../model";


export const createCarousel = async (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, desc, buttons,img_url } = req.body;

  // 1. 校验必填字段
  if (!title || !subtitle || !desc ) {
    return res.status(400).json({ code: 1, message: "请提供完整的轮播图信息" });
  }

  // 2. 创建轮播图
  const newCarousel = new Carousel({ title, subtitle, desc, buttons,img_url });

  // 3. 保存数据
  await newCarousel.save();

  res.json({ code: 0, message: "轮播图创建成功", carouselId: newCarousel._id });
};

export const deleteCarousel = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.query;
console.log(id);

  // 1. 查找并删除轮播图
  const deletedCarousel = await Carousel.findByIdAndDelete(id);
  if (!deletedCarousel) {
    return res.status(404).json({ code: 1, message: "轮播图不存在" });
  }

  res.json({ code: 0, message: "轮播图删除成功" });
};

export const updateCarousel = async (req: AuthenticatedRequest, res: Response) => {

  const { id,title, subtitle, desc, buttons } = req.body;

  // 1. 查找轮播图
  const carousel = await Carousel.findById(id);
  if (!carousel) {
    return res.status(404).json({ code: 1, message: "轮播图不存在" });
  }

  // 2. 更新数据
  if (title) carousel.title = title;
  if (subtitle) carousel.subtitle = subtitle;
  if (desc) carousel.desc = desc;
  if (Array.isArray(buttons) && buttons.length > 0) carousel.buttons = buttons;

  // 3. 保存更新后的数据
  await carousel.save();

  res.json({ code: 0, message: "轮播图更新成功" });
};

export const getAllCarousels = async (req: Request, res: Response) => {
  const carousels = await Carousel.find().sort({ createdAt: -1 }); // 按创建时间倒序排列
  res.json({ code: 0, message: "查询成功", data: carousels });
};



// 项目

// 创建项目
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  const { title, img_url, category, button_url, content } = req.body;

  // 1. 校验必填字段
  if (!title || !category || !button_url || !content) {
    return res.status(400).json({ code: 1, message: "请提供完整的项目信息" });
  }

  // 2. 创建项目
  const newProject = new Project({ title, img_url, category, button_url, content });

  // 3. 保存数据
  await newProject.save();

  res.json({ code: 0, message: "项目创建成功", projectId: newProject._id });
};

// 删除项目
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.query;

  // 1. 查找并删除项目
  const deletedProject = await Project.findByIdAndDelete(id);
  if (!deletedProject) {
    return res.status(404).json({ code: 1, message: "项目不存在" });
  }

  res.json({ code: 0, message: "项目删除成功" });
};

// 更新项目
export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id, title, img_url, category, likes, button_url, content } = req.body;

  // 1. 查找项目
  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ code: 1, message: "项目不存在" });
  }

  // 2. 更新数据
  if (title) project.title = title;
  if (img_url) project.img_url = img_url;
  if (category) project.category = category;
  if (typeof likes === "number") project.likes = likes;
  if (button_url) project.button_url = button_url;
  if (content) project.content = content;

  // 3. 保存更新后的数据
  await project.save();

  res.json({ code: 0, message: "项目更新成功" });
};

// 获取所有项目
export const getAllProjects = async (req: Request, res: Response) => {
  const projects = await Project.find().sort({ createdAt: -1 }); // 按创建时间倒序排列
  res.json({ code: 0, message: "查询成功", data: projects });
};

//点赞
export const likeProject = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.body; // 获取项目 ID

  // 1. 查找项目
  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ code: 1, message: "项目不存在" });
  }

  // 2. 更新点赞数
  project.likes += 1; // 点赞数 +1

  // 3. 保存更新后的数据
  await project.save();

  res.json({ code: 0, message: "点赞成功", likes: project.likes });
};