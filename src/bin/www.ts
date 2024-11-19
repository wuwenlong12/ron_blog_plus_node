// 使用 Node.js 环境运行此脚本


// 导入应用实例（通常是 Express 应用）
import app from '../app';
// 导入 debug 模块用于调试信息输出
import debug from 'debug';
// 导入 Node.js 内置的 http 模块来创建 HTTP 服务器
import http from 'http';

// 获取环境变量中的端口号，并存储到 Express 应用中
// 如果没有设置 PORT 环境变量，则默认使用 3000 端口
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port); // 设置 Express 应用使用的端口

// 创建 HTTP 服务器，传入 Express 应用作为请求处理程序
const server = http.createServer(app);

// 开始监听指定端口上的所有网络接口
server.listen(port, () => {
  console.log(`服务器已启动: ${port}`); // 当服务器成功启动时打印一条消息
});

// 注册错误事件处理器
server.on('error', onError);
// 注册监听事件处理器
server.on('listening', onListening);

// 将端口号或管道名称规范化为数字、字符串或布尔值
function normalizePort(val: string | number): number | string | boolean {
  const port = parseInt(val.toString(), 10); // 尝试将值转换为整数

  if (isNaN(port)) {
    // 如果转换失败（即输入不是有效的数字），则认为是命名管道
    return val;
  }

  if (port >= 0) {
    // 如果转换成功且为非负数，则返回该数字
    return port;
  }

  // 如果既不是有效的数字也不是命名管道，则返回 false 表示无效
  return false;
}

// 错误事件处理器
function onError(error: Error & { syscall?: string; code?: string }): void {
  if (error.syscall !== 'listen') {
    // 如果错误不是发生在监听阶段，则直接抛出错误
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port // 如果端口是一个字符串，表示这是一个命名管道
    : 'Port ' + port; // 否则，这是一个端口号

  // 根据错误代码提供友好的错误信息
  switch (error.code) {
    case 'EACCES': // 权限不足
      console.error(bind + ' requires elevated privileges'); // 输出错误信息
      process.exit(1); // 退出进程
      break;
    case 'EADDRINUSE': // 地址已被使用
      console.error(bind + ' is already in use'); // 输出错误信息
      process.exit(1); // 退出进程
      break;
    default: // 其他未知错误
      throw error; // 抛出错误
  }
}

// 监听事件处理器
function onListening(): void {
  const addr = server.address(); // 获取服务器地址
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr // 如果地址是字符串，表示这是一个命名管道
    : 'port ' + (addr?.port ?? ''); // 否则，这是端口号

  // 使用 debug 模块输出调试信息
  debug('Listening on ' + bind);
}