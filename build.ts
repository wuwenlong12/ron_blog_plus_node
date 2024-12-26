import { build } from 'esbuild';

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
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();