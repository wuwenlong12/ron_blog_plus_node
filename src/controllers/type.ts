import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
    // 你可以根据 token 的内容定义更多字段
  },
  subdomain?: string
  subdomain_id?: Types.ObjectId
  body: {
    data: string;
  } & Request['body'];  // 将你自定义的 body 和 Request 原有的 body 合并
}
