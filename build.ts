import { build } from 'esbuild';
import 'dotenv-flow/config';
// 获取当前的环境变量
const defineEnv = Object.keys(process.env).reduce((acc, key) => {
  // 用反引号确保将每个环境变量替换为字符串值
  acc[`process.env.${key}`] = `"${process.env[key]}"`;
  return acc;
}, {});
console.log(defineEnv);

async function runBuild() {
  try {
    await build({
      entryPoints: ['./src/bin/www.ts'], // 项目的入口文件
      outfile: './dist/index.js', // 输出的文件路径
      bundle: true, // 打包所有依赖
      platform: 'node', // 指定为 Node.js 环境
      target: 'node18', // 目标 Node.js 版本
      minify: true, // 压缩输出的代码
      sourcemap: false, // 不生成 SourceMap
      define: {
        // 动态传递所有环境变量
        ...defineEnv,
      },
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();