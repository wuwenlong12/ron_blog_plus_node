import { NextFunction, Request, Response } from "express";
// 查询系统是否初始化

function removeText(input: string, textToRemove: string): string {
    const regex = new RegExp(textToRemove, "g"); // 创建一个全局匹配的正则表达式
    return input.replace(regex, ""); // 替换掉指定的文字
  }
export const checkSystemInitialized = async (
  req: Request & { subdomain: string | null },
  res: Response,
  next: NextFunction
) => {
  const host = req.hostname; // 获取主机名
  const hostArray = host.split(".");
  hostArray.pop();
  // 假设子域名是主机名的第一个部分
  const getSubdomain = () => {
    if (process.env.CROS_DOMAIN === host) return null
    return removeText(host, '.'+process.env.CROS_DOMAIN);
  };

  const subdomain = getSubdomain()
  req.subdomain = subdomain
 

   next();
};
