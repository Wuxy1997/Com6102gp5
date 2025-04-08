#!/bin/bash

# 登录获取 session
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","redirect":false}' \
  -c cookies.txt)

# 测试聊天功能
echo "Testing chat..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"action":"chat","message":"Can you give me some beginner exercises?"}')

echo "Chat Response:"
echo $CHAT_RESPONSE | jq

# 测试推荐功能
echo "Testing recommendations..."
RECOMMEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"action":"recommend","type":"exercise"}')

echo "Recommendations Response:"
echo $RECOMMEND_RESPONSE | jq

# 清理
rm cookies.txt 