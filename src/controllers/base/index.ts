import db from "../../model";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "./type";


const Carousel = db.model("Carousel");
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