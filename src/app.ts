import createError from 'http-errors';
import express from 'express';
import path from 'path';
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
import dotenv from 'dotenv';
const app: express.Application = express();
// 加载 .env 文件
dotenv.config();
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
const publicPath = path.resolve(__dirname, '../public');

app.use('/static', express.static(publicPath))




// 解析jwt
app.use(
  jwt({
    secret: 'wu0427..',
    algorithms: ['HS256'],
  }).unless({
    // 要排除的 路由
    path: [
      '/users/register', 
      '/users/login', 
      '/api/folder',
      '/api/article/content',
      '/api/folder/order',
      /^\/folder\//, // 排除 /artical 目录下所有路由
      /^\/public\//
    ],
  })
);

app.use(cors());
app.use(logger('dev'));
app.use(uploader());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/folder', folderRouter);
app.use('/api/article', articleRouter);
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