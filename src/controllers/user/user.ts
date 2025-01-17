import jwt from 'jsonwebtoken';
import * as bcrypt from '../../utils/bcrypt';
import { validateInput } from '../../utils/reg';
import { generateEncryptedString } from '../../utils/encipher';
// import db, { IUser } from '../../model';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './type';

// const User = db.model('User');

// 新建用户
export const register = async (req: Request, res: Response) => {
    // const { username, email, password } = req.body;
    // const flag = validateInput(username, email, password);

    // if (flag.valid) {
    //     const isReg = await isRegister(email);
    //     console.log('hhh' + isReg);

    //     if (!isReg) {
    //         const EnPassword = bcrypt.encryptin(password);
    //         const account = generateEncryptedString(email);
    //         const data = {
    //             account,
    //             email,
    //             username,
    //             password: EnPassword,
    //         };
    //         const user = new User(data);


    //         await user.save();
    //         res.send({
    //             code: 0,
    //             message: "Success",
    //             data: {}
    //         });

    //     } else {
    //         res.send({
    //             code: 1,
    //             message: "Error: 邮箱已注册",
    //             data: {}
    //         });
    //     }
    // } else {
    //     res.send({
    //         code: 1,
    //         message: "Error: " + flag.message,
    //         data: {}
    //     });
    // }
};

// 邮箱是否已经注册
const isRegister = async (email: string) => {
    // let flag: boolean = false
    // const wherestr = { email };
    // const count = await User.countDocuments(wherestr);
    // flag = count > 0;
    // return flag;
};

// 邮箱/用户名是否已经注册
export const repeat = async (data: string, type: string, res: Response) => {
    // let isRepeat: boolean = false
    // const wherestr = { [type]: data };
    // const result = await User.countDocuments(wherestr);
    // isRepeat = result > 0;
    // res.send({
    //     code: 0,
    //     message: "Success",
    //     data: result
    // });
    // return { type, isRepeat };
};

// 用户验证
export const login = async (req: Request, res: Response) => {
    // const { data, password } = req.body;
    // if (data && password) {
    //     const wherestr = { $or: [{ account: data }, { email: data }] };
    //     const out = { account: 1, imgurl: 1, password: 1, username: 1 };
    //     const result = await User.find(wherestr, out).exec();
    //     if (result.length === 0) {
    //         return res.json({
    //             code: 1,
    //             message: "账号不存在，请检查账号输入",
    //             data: {}
    //         });
    //     }
    //     const validUser = result.find(item => {
    //         console.log(item);
    //         return bcrypt.verification(password, item.password);
    //     });
    //     if (!validUser) {
    //         return res.json({
    //             code: 1,
    //             message: "密码错误",
    //             data: {}
    //         });
    //     }
    //     const token = jwt.sign({ username: validUser.account, uid: validUser._id.toString() }, 'wu0427..', { expiresIn: '1d', algorithm: 'HS256' });
    //     const responseData = {
    //         id: validUser._id,
    //         account: validUser.account,
    //         imgurl: validUser.imgurl,
    //         username: validUser.username,
    //         token
    //     };
    //     return res.json({
    //         code: 0,
    //         message: "Success",
    //         data: responseData
    //     });
    // } else {
    //     res.send({
    //         code: 1,
    //         message: "Error: 账号或密码为空",
    //         data: {}
    //     });
    // }
};

export const userDetial = async (req: AuthenticatedRequest, res: Response) => {
    // const uid = req.auth?.uid;
    // const wherestr = { '_id': uid }
    // const out = { 'password': 0 }
    // try {
    //     const result: IUser | null = await User.findOne(wherestr, out).exec()
    //     if (!result) return
    //     const fileUrl = `${req.protocol}://${req.get('host')}${result?.imgurl}`; // 构建文件 URL
    //     result.imgurl = fileUrl
    //     res.send({
    //         code: 0,
    //         message: 'Success',
    //         data:  result 
    //     })
    // } catch (error) {
    //     console.log(error);
    //     res.send({
    //         code: 1,
    //         message: "Error" + error,
    //         data: {}
    //     })
    // }
}