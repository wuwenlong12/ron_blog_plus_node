import { NextFunction, Request, Response } from "express";
import { Site } from "../model";
import { Types } from "mongoose";
// 查询系统是否初始化

function removeText(input: string, textToRemove: string): string {
    const regex = new RegExp(textToRemove, "g"); // 创建一个全局匹配的正则表达式
    return input.replace(regex, ""); // 替换掉指定的文字
  }
  const getSubdomain = (host:string) => {
    if (process.env.CROS_DOMAIN === host) return null
    return removeText(host, '.'+process.env.CROS_DOMAIN);
  };
export const checkSystemInitialized = async (
  req: Request & { subdomain: string | null,subdomain_id:Types.ObjectId|undefined},
  res: Response,
  next: NextFunction
) => {
  const host = req.hostname; // 获取主机名
  if(host === undefined) return res.status(400).json({ code: 1, message: "host is undefined" });
  const subdomain = getSubdomain(host)
  const site = await Site.findOne({ site_sub_url: subdomain });
  if (!site && subdomain !== null ) {
    return res.status(404).json({ code: 2, message: "站点不存在" });
  }
  req.subdomain = subdomain
  req.subdomain_id = site?._id
   next();
};
