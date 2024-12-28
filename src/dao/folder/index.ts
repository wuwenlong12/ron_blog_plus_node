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
  const { name, parentFolderId, type ,tags} = req.body;

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
        data: { ...newFolder.toObject(), type: "folder" },
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
      const Tag = db.model("Tag");
      const tagIds: mongoose.Types.ObjectId[] = [];
      if (tags && tags.length > 0) {
        // 遍历 tags 数组，检查并存储标签
        for (const tag of tags) {
          const existingTag = await Tag.findOne({ name: tag.name });

          if (!existingTag) {
            // 如果标签不存在，创建新的标签
            const newTag = new Tag({
              name: tag.name,
              color: tag.color,
            });
            await newTag.save();
            tagIds.push(newTag._id);
          } else {
            // 如果标签已存在，直接使用该标签的 ID
            tagIds.push(existingTag._id);
          }
        }
      }
      // 创建文章
      const newArticle = new Article({
        title: name,
        tags:tagIds,
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
        data: { ...newArticle.toObject(), type: "article" },
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
  const { itemId, type } = req.query;

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

      await deleteFolderAndChildren((itemId) as string);

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
  const { itemId, type, dropOrder, newParentFolderId } = req.body;

  if (!itemId || !type || dropOrder === undefined) {
    return res.status(400).json({ code: 1, message: '缺少必要参数或参数格式错误' });
  }

  try {
    // 通用的更新排序逻辑
    const updateItemOrder = async (model: any, itemId: string, newParentFolderId: string | null, dropOrder: number) => {
      const itemToUpdate = await model.findById(itemId);
      if (!itemToUpdate) {
        return res.status(404).json({ code: 1, message: '项目不存在' });
      }

      // 更新目标项目的 parentFolderId
      itemToUpdate.parentFolder = newParentFolderId || null;
      await itemToUpdate.save();

      // 获取目标父文件夹下的所有项目，按 order 排序
      const siblingItems = await model.find({
        parentFolder: newParentFolderId || null,
      }).sort('order');

      // 找到原始数组中当前项目的索引（在删除前计算插入索引）
      const originalIndex = siblingItems.findIndex(
        (item: any) => item._id.toString() === itemId
      );

      // 计算插入位置
      const adjustedDropOrder =
        dropOrder > originalIndex ? dropOrder - 1 : dropOrder;

      // 将当前项目从兄弟节点中移除
      const updatedItems = siblingItems.filter((item: any) => item._id.toString() !== itemId);

      // 在指定的间隙位置插入拖动的项目
      updatedItems.splice(adjustedDropOrder, 0, itemToUpdate);

      // 更新所有项目的 order
      await Promise.all(
        updatedItems.map((item: any, index: number) => {
          item.order = index; // 索引即为 order
          return item.save();
        })
      );
    };

    // 根据类型调用对应的更新逻辑
    if (type === 'folder') {
      await updateItemOrder(Folder, itemId, newParentFolderId, dropOrder);
      return res.status(200).json({ code: 0, message: '文件夹移动并排序更新成功' });
    } else if (type === 'article') {
      await updateItemOrder(Article, itemId, newParentFolderId, dropOrder);
      return res.status(200).json({ code: 0, message: '文章移动并排序更新成功' });
    } else {
      return res.status(400).json({ code: 1, message: '无效的类型' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 1, message: '移动或排序更新失败，请稍后重试' });
  }
};