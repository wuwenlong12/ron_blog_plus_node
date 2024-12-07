import { Response } from "express";
import { AuthenticatedRequest } from "./type";
import db, { IArticle, IFolder } from "../../model";
import mongoose, { FilterQuery } from "mongoose";

// 添加文件夹接口
// 添加文件夹或文章接口
export const AddNewFolderOrArticle = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model<IFolder>("Folder");
  const Article = db.model<IArticle>("Article");
  const { name, parentFolderId, type, content } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ code: 1, message: "名称不能为空" });
  }

  try {
    // 验证 parentFolderId 是否有效
    if (parentFolderId && !mongoose.Types.ObjectId.isValid(parentFolderId)) {
      return res.status(400).json({ code: 1, message: "无效的父级文件夹 ID" });
    }

    if (parentFolderId) {
      const parentFolder = await Folder.findById(parentFolderId);
      if (!parentFolder) {
        return res
          .status(400)
          .json({ code: 1, message: "无效的父级文件夹 ID" });
      }
    }

    if (type === "folder") {
      // 检查文件夹是否重名
      const existingFolder = await Folder.findOne({
        name,
        parentFolder: parentFolderId,
      });
      if (existingFolder) {
        return res.status(400).json({ code: 1, message: "文件夹名称已存在" });
      }

      // 更新同级 order 值
      await Folder.updateMany(
        { parentFolder: parentFolderId || null },
        { $inc: { order: 1 } }
      );

      // 创建文件夹
      const newFolder = new Folder({
        name,
        parentFolder: parentFolderId || null,
        order: 0,
      });
      await newFolder.save();

      return res.status(201).json({
        code: 0,
        message: "文件夹创建成功",
        item: { ...newFolder.toObject(), type: "folder" },
      });
    } else if (type === "article") {
      if (!content || content.trim() === "") {
        return res.status(400).json({ code: 1, message: "文章内容不能为空" });
      }

      if (!mongoose.Types.ObjectId.isValid(parentFolderId)) {
        return res
          .status(400)
          .json({ code: 1, message: "文件必须含有父级目录" });
      }
      // 检查文章是否重名
      const existingArticle = await Article.findOne({
        title: name,
        parentFolder: parentFolderId,
      });
      if (existingArticle) {
        return res.status(400).json({ code: 1, message: "文章标题已存在" });
      }

      // 更新同级 order 值
      await Article.updateMany(
        { parentFolder: parentFolderId || null },
        { $inc: { order: 1 } }
      );

      // 创建文章
      const newArticle = new Article({
        title: name,
        content,
        parentFolder: parentFolderId || null,
        order: 0,
      });
      await newArticle.save();

      return res.status(201).json({
        code: 0,
        message: "文章创建成功",
        item: { ...newArticle.toObject(), type: "article" },
      });
    } else {
      return res.status(400).json({ code: 1, message: "无效的类型" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 1, message: "创建失败，请稍后重试" });
  }
};

export const GetFoldersAndArticles = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const { id } = req.query;

  //如果有id则查找单个文件夹的信息，带详情
  if (id) {
    const item = await Folder.findById(id);
    return res.status(201).json({
      code: 0,
      message: "查找文章信息成功",
      data: item,
    });
  }

  const Article = db.model("Article");
  const folders: IFolder[] = await Folder.find().sort({ order: 1 }).exec();
  const articles: IArticle[] = await Article.find().sort({ order: 1 }).exec();
  const treeData = buildTree(folders, articles);
  console.log(treeData);

  res.status(201).json({
    code: 0,
    message: "查找树状目录成功",
    data: treeData,
  });
};

// 定义树节点类型
interface TreeNode {
  _id: mongoose.Types.ObjectId; // 唯一ID
  name?: string; // 文件夹名称
  title?: string; // 文章标题
  type: "folder" | "article"; // 节点类型
  children?: TreeNode[]; // 子节点数组
  order: number; // 排序字段
}

// 主函数
const buildTree = (folders: IFolder[], articles: IArticle[]): TreeNode[] => {
  // 定义文件夹映射表，类型明确
  const folderMap = new Map<string, TreeNode>();

  // 初始化文件夹节点
  folders.forEach((folder) => {
    folderMap.set(folder._id.toString(), {
      _id: folder._id,
      name: folder.name,
      type: "folder",
      children: [],
      order: folder.order,
    });
  });

  // 将文章添加到对应的文件夹
  articles.forEach((article) => {
    const folderNode = folderMap.get(article.parentFolder.toString());
    if (folderNode) {
      folderNode.children!.push({
        _id: article._id,
        name: article.title,
        type: "article",
        order: article.order,
      });
    }
  });

  // 构建树结构
  const rootFolders: TreeNode[] = [];
  folders.forEach((folder) => {
    if (folder.parentFolder) {
      const parent = folderMap.get(folder.parentFolder.toString());
      if (parent) {
        parent.children!.push(folderMap.get(folder._id.toString())!);
      }
    } else {
      rootFolders.push(folderMap.get(folder._id.toString())!);
    }
  });

  return rootFolders;
};

// 更新文章内容接口
export const UpdateArticleContent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const { articleId, newContent } = req.body;

  if (!articleId || !newContent) {
    return res.status(400).json({ code: 1, message: "文章 ID 或内容不能为空" });
  }

  // 查找文章
  const article = await Folder.findOne({ _id: articleId, type: "article" });
  if (!article) {
    return res.status(404).json({ code: 1, message: "文章不存在" });
  }

  // 更新文章内容
  article.content = newContent;
  await article.save();

  res.status(200).json({
    code: 0,
    message: "文章内容更新成功",
    article,
  });
};

//删除文件夹
export const DeleteItem = async (req: AuthenticatedRequest, res: Response) => {
  const Folder = db.model("Folder");
  const Article = db.model("Article");
  const { itemId, type } = req.body;

  if (!itemId || !type) {
    return res.status(400).json({ code: 1, message: "未提供 ID 或类型" });
  }

  try {
    if (type === "folder") {
      // 查找目标文件夹
      const folderToDelete = await Folder.findById(itemId);
      if (!folderToDelete) {
        return res.status(404).json({ code: 1, message: "文件夹不存在" });
      }

      // 删除文件夹及其所有子目录
      const deleteFolderAndChildren = async (folderId: string) => {
        // 查找子目录
        const childFolders = await Folder.find({ parentFolder: folderId });
        for (const child of childFolders) {
          await deleteFolderAndChildren(child._id); // 递归删除子目录
        }
        // 删除当前文件夹
        await Folder.findByIdAndDelete(folderId);
      };

      await deleteFolderAndChildren(itemId);

      return res.status(200).json({
        code: 0,
        message: "文件夹及其子目录删除成功",
      });
    } else if (type === "article") {
      // 查找目标文章
      const articleToDelete = await Article.findById(itemId);
      if (!articleToDelete) {
        return res.status(404).json({ code: 1, message: "文章不存在" });
      }

      // 删除文章
      await Article.findByIdAndDelete(itemId);

      return res.status(200).json({
        code: 0,
        message: "文章删除成功",
      });
    } else {
      return res.status(400).json({ code: 1, message: "无效的类型" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 1,
      message: "删除失败，请稍后重试",
    });
  }
};

// 修改文件夹名称接口
export const UpdateFolderInfo = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const { folderId, newName, newDesc } = req.body;

  if (!folderId || !newName || newName.trim() === "") {
    return res
      .status(400)
      .json({ code: 1, message: "文件夹 ID 或新名称不能为空" });
  }

  // 查找要更新名称的文件夹
  const folderToUpdate = await Folder.findById(folderId);
  if (!folderToUpdate) {
    return res.status(404).json({ code: 1, message: "文件夹不存在" });
  }

  // 检查新名称是否已经存在（同一父目录下）
  const existingFolder = await Folder.findOne({
    name: newName,
    parentFolder: folderToUpdate.parentFolder,
  });


  if (existingFolder) {
    const isCurrentId = existingFolder._id.toString() === folderId
    if (!isCurrentId) {
      return res
        .status(400)
        .json({ code: 1, message: "文件夹名称已存在，请选择其他名称" });
    }
  }

  // 更新文件夹名称
  folderToUpdate.name = newName;
  folderToUpdate.desc = newDesc;
  await folderToUpdate.save();

  res.status(200).json({
    code: 0,
    message: "文件夹名称更新成功",
    folder: folderToUpdate,
  });
};

export const UpdateItemOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const Article = db.model("Article");
  const { itemId, type, newOrder, parentFolderId } = req.body;

  if (!itemId || !type || typeof Number(newOrder) !== "number") {
    return res
      .status(400)
      .json({ code: 1, message: "缺少必要参数或参数格式错误" });
  }

  try {
    if (type === "folder") {
      // 查找目标文件夹
      const folderToUpdate = await Folder.findById(itemId);
      if (!folderToUpdate) {
        return res.status(404).json({ code: 1, message: "文件夹不存在" });
      }

      // 获取同级文件夹
      const siblingFolders = await Folder.find({
        parentFolder: parentFolderId || null,
      }).sort("order");

      // 调整排序
      const updatedFolders = siblingFolders.map((folder) => {
        if (folder._id.toString() === itemId) {
          folder.order = newOrder;
        } else if (folder.order >= newOrder) {
          folder.order += 1; // 将新位置之后的项目顺序往后推
        }
        return folder;
      });

      // 批量保存
      await Promise.all(updatedFolders.map((folder) => folder.save()));

      return res.status(200).json({
        code: 0,
        message: "文件夹排序更新成功",
      });
    } else if (type === "article") {
      // 查找目标文章
      const articleToUpdate = await Article.findById(itemId);
      if (!articleToUpdate) {
        return res.status(404).json({ code: 1, message: "文章不存在" });
      }

      // 获取同级文章
      const siblingArticles = await Article.find({
        parentFolder: parentFolderId || null,
      }).sort("order");

      // 调整排序
      const updatedArticles = siblingArticles.map((article) => {
        if (article._id.toString() === itemId) {
          article.order = newOrder;
        } else if (article.order >= newOrder) {
          article.order += 1; // 将新位置之后的项目顺序往后推
        }
        return article;
      });

      // 批量保存
      await Promise.all(updatedArticles.map((article) => article.save()));

      return res.status(200).json({
        code: 0,
        message: "文章排序更新成功",
      });
    } else {
      return res.status(400).json({ code: 1, message: "无效的类型" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 1,
      message: "排序更新失败，请稍后重试",
    });
  }
};
