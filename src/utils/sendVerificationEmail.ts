import nodemailer from "nodemailer";
import "dotenv/config";
// 发送验证码邮件
const sendVerificationEmail = async (email: string, code: string) => {
    const transporter = nodemailer.createTransport({
      host: "smtp.163.com", // 邮件服务商
      port: 465,  // 使用SSL加密端口
      auth: {
        user: process.env.EMAIL_USER, // 邮箱账号
        pass: process.env.EMAIL_PASS, // 邮箱密码（或应用密码）
      },
    });


    const mailOptions = {
      from: process.env.EMAIL_USER, // 发送邮箱
      to: email, // 收件人邮箱
      subject: "邮箱验证码", // 邮件标题
      text: `您的验证码是：${code}`, // 邮件内容
    };
  
    await transporter.sendMail(mailOptions); // 发送邮件
  };

  export default sendVerificationEmail

  // 发送邮件
// const mailOptions = {
//     from: '"Your Name" <your-email@163.com>',  // 发件人
//     to: "recipient@example.com",  // 收件人
//     subject: "验证邮件",  // 邮件标题
//     text: "这是一个测试邮件，包含验证码",  // 邮件内容
//     html: "<p>这是一个测试邮件，包含验证码</p>",  // HTML 内容
//   };