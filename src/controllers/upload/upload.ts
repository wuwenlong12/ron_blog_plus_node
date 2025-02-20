import { AuthenticatedRequest } from "./type";
import { Response } from "express";
import { extname, resolve } from "path";
import { promises as fsPromises } from "fs";
import { existsSync } from "fs";
import { File } from "../../model";
import { readdir, readFile, rmdir, unlink } from "fs/promises";

const { writeFile, mkdir } = fsPromises;

export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
  const { name, size, type, offset, hash, chunkIndex, totalChunks } = req.body;

  if (
    !name ||
    !size ||
    !type ||
    !offset ||
    !hash ||
    !chunkIndex ||
    !totalChunks
  ) {
    return res.status(400).send({
      code: 3,
      message:
        "文件上传需要 name, size, type, offset, hash, chunkIndex, totalChunks 参数",
    });
  }
  if (!req.files || !req.files.file) {
    return res.status(400).send({ code: 3, message: "文件未上传" });
  }
  const { file } = req.files;
  const fileInfo = await File.findOne({ hash, name });
  // 如果文件已存在，则直接返回文件URL(秒传)
  if (fileInfo) {
   const break_point = fileInfo.chunkIndex;
    if (fileInfo.is_over) {
      return res
        .status(200)
        .send({ code: 1, message: "文件秒传成功！", fileUrl: fileInfo.path });
    }
    if (break_point > 0 && break_point > chunkIndex ) {
      return res
        .status(200)
        .send({ code: 2, data: `检查到有断点，继续上传` });
    }
  }
  const uploadedFile = Array.isArray(file) ? file[0] : file;
  const ext = extname(name);
  const publicDir = resolve(process.cwd(), "public");
  if (!existsSync(publicDir)) {
    await mkdir(publicDir, { recursive: true });
  }
  // 如果只有一个分片，则直接写入文件
  if (Number(totalChunks) === 1) {
    const filePath = resolve(publicDir, `${hash || name}${ext}`);
    const fileUrl = `${req.protocol}://${req.get("host")}/api/public/${
      hash || name
    }${ext}`; // 构建文件 URL
    await writeFile(filePath, uploadedFile.data);
    await File.create({
      name,
      hash,
      size,
      type,
      path: fileUrl,
      is_over: true,
      totalChunks,
      chunkIndex: 1,
    });
    return res.send({ code: 0, data: "小文件上传成功", fileUrl }); // 返回 URL
  }


  
  const tempDir = resolve(process.cwd(), publicDir, "temp");
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }
  const chunkDir = resolve(tempDir, hash);
  if (!existsSync(chunkDir)) {
    await mkdir(chunkDir, { recursive: true });
  }
  const chunkPath = resolve(chunkDir, `${hash}_${chunkIndex}.tmp`);
  await writeFile(chunkPath, uploadedFile.data);

  if (Number(chunkIndex) === Number(totalChunks) - 1) {
    console.log("开始合并文件");
    // 合并文件
    const filePath = resolve(publicDir, `${hash || name}${ext}`);
    const fileUrl = `${req.protocol}://${req.get("host")}/api/public/${
      hash || name
    }${ext}`; // 构建文件 URL
    const result = await mergeFiles(chunkDir, filePath, totalChunks, hash);
    if (result.isSuccess) {
      await File.updateOne({ hash, name }, { is_over: true, path: fileUrl });
      return res.status(200).send({ code: 0, data: "文件上传成功", fileUrl });
    } else {
      return res.status(500).send({ code: 3, message: result.message });
    }
  }

  if (Number(chunkIndex) === 0) {
    await File.create({
      name,
      hash,
      size,
      type,
      is_over: false,
      totalChunks,
      chunkIndex: Number(chunkIndex) + 1,
    });
  } else {
    await File.updateOne(
      { hash, name },
      { chunkIndex: Number(chunkIndex) + 1 }
    );
  }
  
  return res.status(200).send({ code: 2, data: `分片${chunkIndex}上传成功` });
};

const mergeFiles = async (
  chunkDir: string,
  filePath: string,
  totalChunks: number,
  hash: string
) => {
  console.log("开始合并文件");

  if (!existsSync(chunkDir)) {
    return { isSuccess: false, message: "分片文件夹不存在" };
  }
  // 获取所有分片
  const chunkFiles = await readdir(chunkDir);
  console.log(chunkFiles.length, totalChunks);

  if (Number(chunkFiles.length) !== Number(totalChunks)) {
    return { isSuccess: false, message: "分片数量不匹配" };
  }
  // 过滤符合命名规则的分片，并按 chunkIndex 排序
  const sortedChunks = chunkFiles
    .filter((file) => file.startsWith(`${hash}_`)) // 过滤掉非分片文件
    .map((file) => ({
      index: Number(file.split("_")[1].split(".")[0]), // 解析出 chunkIndex
      filePath: resolve(chunkDir, file),
    }))
    .sort((a, b) => a.index - b.index); // 按 chunkIndex 排序

  const mergedFile = await Promise.all(
    sortedChunks.map(async (chunk) => await readFile(chunk.filePath))
  );

  await writeFile(filePath, Buffer.concat(mergedFile)); // 合并写入完整文件

  // 清理分片文件
  await Promise.all(
    sortedChunks.map(async (chunk) => await unlink(chunk.filePath))
  );

  // 删除分片存储目录
  await rmdir(chunkDir);
  return { isSuccess: true, message: "文件合并成功" };
};
