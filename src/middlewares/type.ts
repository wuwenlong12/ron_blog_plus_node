import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
    // 你可以根据 token 的内容定义更多字段
  },
  body: {
    data: string;
  } & Request['body'];  // 将你自定义的 body 和 Request 原有的 body 合并
}
