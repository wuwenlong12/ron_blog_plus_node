import express, { NextFunction, Request, Response } from 'express';

import { uploadFile } from '../dao/upload/upload';


const router = express.Router();



// 创建一个路由来处理文件上传
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await uploadFile(req, res);
  } catch (error) {
    next(error);
  }

});

export default router;
