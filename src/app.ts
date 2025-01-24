import createError from 'http-errors';
import express from 'express';
import path, { resolve } from 'path';
import  cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import { expressjwt as jwt } from 'express-jwt';
import uploader  from 'express-fileupload';
// import indexRouter from './routes/index';
import usersRouter from './routes/users';
import uploadRouter from './routes/upload'
import folderRouter from './routes/folder'
import articleRouter from './routes/article'
import tagRouter from './routes/tag'
import diaryRouter from './routes/diary'
import baseRouter from './routes/base'

const app: express.Application = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 设置跨域访问
app.all('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 设置允许跨域的域名，*代表允许任意域名跨域
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  // 允许的header类型
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  // 跨域允许的请求方式
  res.header(
    'Access-Control-Allow-Methods',
    'PATCH,PUT,POST,GET,DELETE,OPTIONS'
  );
  // 可以带cookies
  res.header('Access-Control-Allow-Credentials', "true");
  if (req.method === 'OPTIONS') {
    res.sendStatus(200).end();
  } else {
    next();
  }
});
const publicPath = resolve(process.cwd(), "public");
console.log("publicPath"+publicPath);


app.use('/api/public', express.static(publicPath))


app.use(cookieParser());

// 解析jwt
app.use(
  jwt({
    secret: 'wu0427..',
    algorithms: ['HS256'],
    getToken: (req) => {
      return req.cookies.token; // 这里从 cookie 获取 token
    }
  }).unless({
    // 要排除的 路由
    path: [
      '/api/users/register', 
      '/api/users/auth', 
      '/api/users/init', 
      '/api/users/login', 
      '/api/users/check', 
      '/api/folder',
      '/api/upload',
      '/api/article',
      '/api/article/summary',
      '/api/article/content',
      '/api/folder/order',
      '/api/tag',
      '/api/diary',
      '/api/diary/content',
      '/api/diary/list',
      '/api/diary/date',
      '/api/diary/timeline',
      /^\/folder\//, // 排除 /artical 目录下所有路由
      /^\/api\/public\//, // 排除 /api/public 目录下所有路由
    ],
    custom: (req) => {
      // **如果是 GET 请求，则跳过 JWT 认证**
      return req.method === "GET";
    }
  })
);

app.use(
  cors({
    origin: process.env.CROS_URL, // 允许前端访问
    credentials: true, // 允许携带 Cookie
  })
);
app.use(logger('dev'));
app.use(uploader());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/folder', folderRouter);
app.use('/api/article', articleRouter);
app.use('/api/tag', tagRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/base', baseRouter);
// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
console.log(err);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;