import { ErrorRequestHandler } from "express-serve-static-core";

// // 错误处理中间件
// const errorHandler: ErrorRequestHandler = (err, req, res) => {
//     // 处理 JWT 认证错误
//   if (err.name === "JsonWebTokenError") {
//     res.clearCookie("token");
//     res.status(401).json({
//       code: 401,
//       message: "Token 已失效，请重新登录"
//     });
//     return;
//   }

//   // 其他错误
//   const status = err.status || 500;
//   res.status(status).json({
//     code: status,
//     message: err.message || "服务器内部错误",
//     ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
//   });
    
//   };

// export default errorHandler;
  