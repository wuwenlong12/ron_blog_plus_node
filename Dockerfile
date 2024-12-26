# 使用官方 Node.js 镜像
FROM node:18

# 设置工作目录
WORKDIR /usr/src/app

# 复制打包后的文件（从 GitHub Actions 上传的 dist/index.js）
COPY dist/index.js ./


# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "index.js"]