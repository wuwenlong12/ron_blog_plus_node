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
  const { name, parentFolderId, type } = req.body;

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
        content:[{
          id: "b7e79971-43cb-42d7-886c-5598f5c911fa",
          type: "paragraph",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
          },
          content: [
            {
              type: "text",
              text: "快开始分享你的知识吧～",
              styles: {
                italic: true,
                underline: true,
              },
            },
          ],
          children: [],
        }],
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

export const GetFoldersOrItemInfo = async (
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
      message: "查找文件夹信息成功",
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

const buildTree = (folders: IFolder[], articles: IArticle[]): TreeNode[] => {
  // 定义文件夹映射表
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

  // 将文章添加到对应的文件夹或根节点
  articles.forEach((article) => {
    const folderNode = article.parentFolder
      ? folderMap.get(article.parentFolder.toString())
      : null;

    const articleNode: TreeNode = {
      _id: article._id,
      name: article.title,
      type: "article",
      order: article.order,
    };

    if (folderNode) {
      folderNode.children!.push(articleNode);
    } else {
      // parentFolder 为空，直接放在根节点
      rootFolders.push(articleNode);
    }
  });

  // 对树的节点及其子节点进行排序
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((node) => {
      if (node.children) {
        sortTree(node.children);
      }
    });
  };
  sortTree(rootFolders);

  return rootFolders;
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
export const UpdateFolderName = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const { folderId, newName } = req.body;

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
  // folderToUpdate.desc = newDesc;
  await folderToUpdate.save();

  res.status(200).json({
    code: 0,
    message: "文件夹名称更新成功",
    folder: folderToUpdate,
  });
};


// 修改文件夹名称接口
export const UpdateFolderDesc = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const Folder = db.model("Folder");
  const { folderId, newDesc } = req.body;

// 查找要更新描述的文件夹
  const folderToUpdate = await Folder.findById(folderId);
  console.log(folderToUpdate);
  
  folderToUpdate.desc = newDesc;
  await folderToUpdate.save();

  res.status(200).json({
    code: 0,
    message: "文件夹描述更新成功",
    folder: folderToUpdate,
  });
};



export const UpdateItemOrder = async (req: AuthenticatedRequest, res: Response) => {
  const Folder = db.model('Folder');
  const Article = db.model('Article');
  const { itemId, type, newOrder, newParentFolderId } = req.body;

  if (!itemId || !type || isNaN(Number(newOrder))) {
    return res.status(400).json({ code: 1, message: '缺少必要参数或参数格式错误' });
  }

  const parsedOrder = Number(newOrder);
  if (parsedOrder < 0) {
    return res.status(400).json({ code: 1, message: '新排序值不能为负数' });
  }

  try {
    if (type === 'folder') {
      const folderToUpdate = await Folder.findById(itemId);
      if (!folderToUpdate) {
        return res.status(404).json({ code: 1, message: '文件夹不存在' });
      }

      // 更新目标文件夹的 parentFolderId
      folderToUpdate.parentFolder = newParentFolderId || null;
      await folderToUpdate.save();

      // 获取目标父文件夹下的所有文件夹，按 order 排序
      const siblingFolders = await Folder.find({
        parentFolder: newParentFolderId || null,
      }).sort('order');

      // 确保新 order 不超过范围
      if (parsedOrder >= siblingFolders.length) {
        return res.status(400).json({ code: 1, message: '新排序值超出范围' });
      }

      // 将当前文件夹插入新位置
      const updatedFolders = siblingFolders.filter((folder) => folder._id.toString() !== itemId);
      updatedFolders.splice(parsedOrder, 0, folderToUpdate);

      // 更新所有文件夹的 order
      await Promise.all(
        updatedFolders.map((folder, index) => {
          folder.order = index;
          return folder.save();
        })
      );

      return res.status(200).json({ code: 0, message: '文件夹移动并排序更新成功' });
    } else if (type === 'article') {
      const articleToUpdate = await Article.findById(itemId);
      if (!articleToUpdate) {
        return res.status(404).json({ code: 1, message: '文章不存在' });
      }

      // 更新目标文章的 parentFolderId
      articleToUpdate.parentFolder = newParentFolderId || null;
      await articleToUpdate.save();

      // 获取目标父文件夹下的所有文章，按 order 排序
      const siblingArticles = await Article.find({
        parentFolder: newParentFolderId || null,
      }).sort('order');

      // 确保新 order 不超过范围
      if (parsedOrder >= siblingArticles.length) {
        console.log(parsedOrder,siblingArticles.length);
        
        return res.status(400).json({ code: 1, message: '新排序值超出范围' });
      }

      // 将当前文章插入新位置
      const updatedArticles = siblingArticles.filter((article) => article._id.toString() !== itemId);
      updatedArticles.splice(parsedOrder, 0, articleToUpdate);

      // 更新所有文章的 order
      await Promise.all(
        updatedArticles.map((article, index) => {
          article.order = index;
          return article.save();
        })
      );

      return res.status(200).json({ code: 0, message: '文章移动并排序更新成功' });
    } else {
      return res.status(400).json({ code: 1, message: '无效的类型' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 1, message: '移动或排序更新失败，请稍后重试' });
  }
};