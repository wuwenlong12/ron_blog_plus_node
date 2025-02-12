import { Response } from "express";
import { AuthenticatedRequest } from "../type";
import { Site, User, Visit } from "../../model";
import mongoose from "mongoose";

// 记录访问
export const recordVisit = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  const { path } = req.body;
  
  if(!subdomain_id) {
    return res.status(200).json({
      code: 1,
      message: "非主要站点"
    });
  }
  // 获取客户端IP，处理本地开发环境的情况
  const ip = req.ip === '::1' ? '127.0.0.1' : req.ip;
  
  // 获取 User-Agent
  const userAgent = req.headers['user-agent'];
  
  // 获取 Referer
  const referer = req.headers.referer || req.headers.referrer;

  const newVisit = new Visit({
    site: subdomain_id,
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown',
    path,
    referer,
    date: new Date(new Date().setHours(0, 0, 0, 0)) // 设置为当天0点
  });

  await newVisit.save();

  return res.status(200).json({
    code: 0,
    message: "访问记录已保存"
  });
};

// 获取访问统计
export const getVisitStats = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  const uid = req?.auth?.uid
  const user = await User.findOne({ _id: uid }).populate('role')
  const isSuperAdmin = user?.role?.name === 'superAdmin'
  console.log(user);
  
  const { startDate, endDate } = req.query;

  // 验证日期格式
  const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 7));
  const end = endDate ? new Date(endDate as string) : new Date();

  // 获取日期范围内的访问记录
  const visits =  await Visit.aggregate([
    {
      $match: {
        site: new mongoose.Types.ObjectId(subdomain_id as string),
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        pv: { $sum: 1 }, // 页面浏览量
        uv: { $addToSet: "$ip" } // 独立访客IP
      }
    },
    {
      $project: {
        date: "$_id",
        pv: 1,
        uv: { $size: "$uv" },
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);

  // 获取访问路径统计
  const pathStats = await Visit.aggregate([
    {
      $match: {
        site: new mongoose.Types.ObjectId(subdomain_id?.toString()),
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$path",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
console.log(isSuperAdmin);

  // 获取来源页面统计
  const refererStats = !isSuperAdmin? await Visit.aggregate([
    {
      $match: {
        site: new mongoose.Types.ObjectId(subdomain_id?.toString()),
        date: { $gte: start, $lte: end },
        referer: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$referer",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]) : await Visit.aggregate([
    {
      $match: {
        date: { $gte: start, $lte: end },
        referer: { $ne: null }
      }
    },
    {
      $group: {
        _id: "$referer",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ])

  return res.status(200).json({
    code: 0,
    data: {
      dailyStats: visits,
      topPaths: pathStats,
      topReferers: refererStats
    },
    message: "获取访问统计成功"
  });
};

// 获取实时访问数据
export const getRealTimeVisits = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  // 获取今日数据
  const todayStats = await Visit.aggregate([
    {
      $match: {
        site: new mongoose.Types.ObjectId(subdomain_id?.toString()),
        date: today
      }
    },
    {
      $group: {
        _id: null,
        pv: { $sum: 1 },
        uv: { $addToSet: "$ip" }
      }
    },
    {
      $project: {
        pv: 1,
        uv: { $size: "$uv" },
        _id: 0
      }
    }
  ]);

  // 获取最近的访问记录
  const recentVisits = await Visit.find({ site: subdomain_id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('ip path userAgent createdAt -_id');

  return res.status(200).json({
    code: 0,
    data: {
      today: todayStats[0] || { pv: 0, uv: 0 },
      recentVisits
    },
    message: "获取实时访问数据成功"
  });
}; 