import { AuthenticatedRequest } from "./type";
import { Response } from 'express';
import { extname, resolve } from 'path';
import { promises as fsPromises } from 'fs';
import { existsSync } from 'fs';

const { writeFile, appendFile } = fsPromises;

export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
  const { name, size, type, offset, hash } = req.body;

  if (!name || !size || !type) {
    return res.status(400).send({ code: 0, message: '文件上传需要 name, size, type 参数' });
  }
console.log(req.files);

  if (!req.files || !req.files.file) {
    return res.status(400).send({ code: 0, message: '文件未上传' });
  }

  const { file } = req.files;
  console.log(file);
  
  const ext = extname(name);
  
  const filename = resolve(__dirname, `../../../public/${hash || name}${ext}`);
  const fileUrl = `${req.protocol}://${req.get('host')}/static/${hash || name}${ext}`; // 构建文件 URL

  try {
    const uploadedFile = Array.isArray(file) ? file[0] : file;

    // 如果是大文件上传（包含分片），需要 hash 和 offset 参数
    if (hash && offset !== undefined) {
      if (offset > 0) {
        if (!existsSync(filename)) {
          return res.status(404).send({ code: 0, message: '文件不存在' });
        }
        await appendFile(filename, uploadedFile.data);
        return res.send({ code: 1, data: 'appended', fileUrl }); // 返回 URL
      } else {
        await writeFile(filename, uploadedFile.data);
        return res.send({ code: 1, data: 'uploaded', fileUrl }); // 返回 URL
      }
    }
  } catch (error) {
    console.error('文件处理错误:', error);
    return res.status(500).send({ code: 0, message: '文件处理失败' });
  }
};
