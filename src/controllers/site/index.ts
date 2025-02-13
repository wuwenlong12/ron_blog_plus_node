import { Response } from "express";
import { AuthenticatedRequest } from "../type";
import { Role, Site, User } from "../../model";
import mongoose from "mongoose";
import { Article, Tag, Diary, Visit } from "../../model";

export const initSite = async (req: AuthenticatedRequest, res: Response) => {
  const { subdomain, siteName, job, name } = req.body;
  const uid = req.auth?.uid;
  const site = await Site.findOne({ subdomain });
  if (site) {
    return res.status(409).json({ code: 1, message: "站点已存在" });
  }
  const newSite = new Site({
    creator: uid,
    site_sub_url: subdomain,
    site_name: siteName,
    profession: job,
    name: name,
  });
  await newSite.save();
  const user = await User.findById(uid).populate("role");
  if (user.role && user?.role.name === "superAdmin") {
    await User.findByIdAndUpdate(uid, { $set: { managedSites: newSite._id } });
    return res.status(200).json({
      code: 0,
      message: "站点创建成功",
      data: {
        site_url: `${process.env.CROS_PROTOCOL}${subdomain}.${process.env.CROS_DOMAIN}${process.env.CROS_PORT === '80' ? "" : ":" + process.env.CROS_PORT}`,
        site_admin_url: `${process.env.CROS_PROTOCOL}${subdomain}.${process.env.CROS_DOMAIN}${process.env.CROS_PORT === '80' ? "" : ":" + process.env.CROS_PORT}/admin`,
      },
    });
  }
  const role = await Role.findOne({ name: "webMaster" });
  await User.findByIdAndUpdate(uid, {
    $set: { managedSites: newSite._id, role: role?._id },
  });

  return res.status(200).json({
    code: 0,
    message: "站点创建成功",
    data: {
      site_url: `${process.env.CROS_PROTOCOL}${subdomain}.${process.env.CROS_DOMAIN}:${process.env.CROS_PORT}`,
      site_admin_url: `${process.env.CROS_PROTOCOL}${subdomain}.${process.env.CROS_DOMAIN}:${process.env.CROS_PORT}/admin`,
    },
  });
};

export const checkSubdomain = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { subdomain } = req.body;
  const site = await Site.findOne({ site_sub_url: subdomain });
  if (site) {
    return res.status(409).json({ code: 1, message: "站点已存在" });
  }
  return res.status(200).json({ code: 0, message: "站点可用" });
};

// 获取站点信息
export const getSiteInfo = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  console.log(subdomain_id);

  const site = await Site.findOne({ _id: subdomain_id });
  await Site.findByIdAndUpdate(subdomain_id, { $inc: { pageView: 1 } });
  if (!site) {
    return res.status(404).json({
      code: 1,
      message: "站点不存在",
    });
  }

  return res.status(200).json({
    code: 0,
    data: site,
    message: "获取站点信息成功",
  });
};

// 更新站点信息
export const updateSiteInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const uid = req.auth?.uid;
  const updateData = req.body;
  const user = await User.findById(uid);
  const site_id = user?.managedSites;

  if (!site_id || !mongoose.Types.ObjectId.isValid(site_id)) {
    return res.status(400).json({
      code: 1,
      message: "无效的站点ID",
    });
  }

  // 移除不允许更新的字段
  const protectedFields = [
    "site_sub_url",
    "is_core",
    "is_pass",
    "is_off",
    "creator",
  ];
  protectedFields.forEach((field) => {
    delete updateData[field];
  });

  const updatedSite = await Site.findByIdAndUpdate(
    site_id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedSite) {
    return res.status(404).json({
      code: 1,
      message: "站点不存在",
    });
  }

  return res.status(200).json({
    code: 0,
    data: updatedSite,
    message: "更新站点信息成功",
  });
};

// 获取所有站点列表
export const getAllSites = async (req: AuthenticatedRequest, res: Response) => {
  const sites = await Site.find({}).select("-password").sort({ createdAt: -1 });

  return res.status(200).json({
    code: 0,
    data: sites,
    message: "获取站点列表成功",
  });
};


// 获取系统统计数据
export const getSystemStats = async (req: AuthenticatedRequest, res: Response) => {
  const subdomain_id = req.subdomain_id;
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const site = await Site.findOne({ _id: subdomain_id });
  if (!site) {
    return res.status(404).json({
      code: 1,
      message: "站点不存在"
    });
  }

  // 并行获取各种统计数据
  const [articleCount, tagCount, diaryCount, visitStats] = await Promise.all([
    Article.countDocuments({ site: subdomain_id }),
    Tag.countDocuments({ site: subdomain_id }),
    Diary.countDocuments({ site: subdomain_id }),
    Visit.aggregate([
      {
        $match: {
          site: new mongoose.Types.ObjectId(subdomain_id?.toString())
        }
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                pv: { $sum: 1 }
              }
            }
          ],
          today: [
            {
              $match: {
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
          ]
        }
      }
    ])
  ]);

  const totalStats = visitStats[0]?.total[0]?.pv || 0;
  const todayStats = visitStats[0]?.today[0] || { pv: 0, uv: 0 };

  return res.status(200).json({
    code: 0,
    data: {
      todayPageView: todayStats.pv,
      todayUniqueView: todayStats.uv,
      totalPageView: totalStats,
      articleCount,
      tagCount,
      diaryCount
    },
    message: "获取系统统计数据成功"
  });
};


