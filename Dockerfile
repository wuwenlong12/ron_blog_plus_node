# 使用官方 Node.js 镜像
FROM node:18

# 设置工作目录
WORKDIR /usr/src/app

# 复制依赖配置
COPY package*.json ./

# 安装依赖
RUN npm install -g pnpm && pnpm install

# 复制代码
COPY . .

# 构建 TypeScript 文件
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "run", "server"]