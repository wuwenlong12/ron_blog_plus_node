import { ErrorRequestHandler } from "express-serve-static-core";

// 错误处理中间件
const errorHandler: ErrorRequestHandler = (err, req, res) => {
    console.error(err);
  
    if (err.name === "UnauthorizedError") {
      res.clearCookie("token");
      res.status(401).json({
        code: 401,
        message: "Token 已失效，请重新登录",
      });
      return;
    }
  
    const status = err.status || 500;
    res.status(status).json({
      code: status,
      message: err.message || "服务器内部错误",
    });
    console.log(err);
    
  };

export default errorHandler;
  