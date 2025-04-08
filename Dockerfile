# Use official Node.js image as base
FROM node:20-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装项目依赖，使用 --legacy-peer-deps 解决依赖冲突
RUN npm install --legacy-peer-deps && \
    npm install --save-dev @types/bcryptjs @types/nodemailer @types/file-saver @types/node @types/next-auth @types/mongodb && \
    npm install next-auth @auth/mongodb-adapter mongodb bcryptjs --legacy-peer-deps

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]

