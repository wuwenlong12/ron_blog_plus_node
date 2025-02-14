import createError from "http-errors";
import express from "express";
import  { resolve } from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import { expressjwt as jwt } from "express-jwt";
import uploader from "express-fileupload";
import usersRouter from "./routes/users";
import uploadRouter from "./routes/upload";
import folderRouter from "./routes/folder";
import articleRouter from "./routes/article";
import tagRouter from "./routes/tag";
import diaryRouter from "./routes/diary";
import baseRouter from "./routes/base";
import siteRouter from "./routes/site";
import { checkSystemInitialized } from "./middlewares/subdomainMiddleware";
const app: express.Application = express();
// import "dotenv/config";
import { initConfig } from "./config";
//初始化数据库
initConfig();

// 设置跨域访问   
app.all(
  "*",
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // 设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    // 允许的header类型
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    // 跨域允许的请求方式
    res.header(
      "Access-Control-Allow-Methods",
      "PATCH,PUT,POST,GET,DELETE,OPTIONS"
    );
    // 可以带cookies
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200).end();
    } else {
      next();
    }
  }
);

const publicPath = resolve(process.cwd(), "public");
app.use("/api/public", express.static(publicPath));
app.use(cookieParser());

const privateGetRoutes = ["/api/site/visit/stats"];
const publicPostRoutes = ["/api/site/visit"];

app.use(
  jwt({
    secret: "wu0427..",
    algorithms: ["HS256"],
    getToken: (req) => {
      return req.cookies.token;
    },
  
  }).unless({
    path: [
      "/api/users/register",
      "/api/users/auth",
      "/api/users/init",
      "/api/users/login",
      "/api/users/check",
      "/api/upload",
      "/api/base/project/like",
    ],
    custom: (req) => {
      // **公开的 POST 请求不需要认证**
      if (req.method === "POST" && publicPostRoutes.includes(req.path)) {
        return true;
      }

      // **私有的 GET 请求需要认证**
      if (req.method === "GET" && privateGetRoutes.includes(req.path)) {
        return false;
      }

      // **默认行为：跳过 GET 请求**
      return req.method === "GET";
    },
  })
);
//  origin: process.env.CROS_URL, // 允许前端访问
const url =
  process.env.CROS_PROTOCOL +
  process.env.CROS_DOMAIN +
  ":" +
  process.env.CROS_PORT;
console.log("url" + url);

const allowedDomain =
  process.env.NODE_ENV === "production"
    ? new RegExp(
        `^http(s)?:\\/\\/([a-zA-Z0-9-]+\\.)?${process.env.CROS_DOMAIN.replace(
          /\./g,
          "\\."
        )}$`
      )
    : new RegExp(`^http(s)?:\\/\\/(.*\\.)?${url.replace(/^https?:\/\//, "")}$`);
console.log(url);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log(origin);

      if (!origin) return callback(null, true); // 允许无来源的请求（如 Postman）
      if (allowedDomain.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 允许携带 Cookie
  })
);
app.use(logger("dev"));
app.use(uploader());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(checkSystemInitialized);

app.use("/api/users", usersRouter);
// app.use('/', indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/folder", folderRouter);
app.use("/api/article", articleRouter);
app.use("/api/tag", tagRouter);
app.use("/api/diary", diaryRouter);
app.use("/api/base", baseRouter);
app.use("/api/site", siteRouter);
// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {

  // 处理 JWT 认证错误
  if (err.name === "JsonWebTokenError") {
    res.clearCookie("token");
    res.status(401).json({
      code: 401,
      message: "Token 已失效，请重新登录"
    });
    return;
  }

  // 其他错误
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: err.message || "服务器内部错误",
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

export default app;
