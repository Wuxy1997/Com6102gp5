import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// 速率限制配置
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 每个IP最多60个请求
}

// 存储请求计数
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// 清理过期的计数
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, RATE_LIMIT.windowMs)

// 日志记录
function logRequest(req: NextRequest, status: number) {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} - ${status} - ${
      req.ip
    }`
  )
}

export async function middleware(request: NextRequest) {
  // 只对API路由应用速率限制
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip || "unknown"
    const now = Date.now()

    // 获取或初始化计数
    let countData = requestCounts.get(ip)
    if (!countData || now > countData.resetTime) {
      countData = { count: 0, resetTime: now + RATE_LIMIT.windowMs }
      requestCounts.set(ip, countData)
    }

    // 检查是否超过限制
    if (countData.count >= RATE_LIMIT.max) {
      logRequest(request, 429)
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    // 增加计数
    countData.count++

    // 检查请求头
    if (request.method === "POST" || request.method === "PUT") {
      const contentType = request.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        logRequest(request, 415)
        return NextResponse.json(
          { error: "Content-Type must be application/json" },
          { status: 415 }
        )
      }
    }
  }

  // 检查认证
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register")

  if (isAuthPage) {
    if (token) {
      logRequest(request, 302)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    logRequest(request, 200)
    return NextResponse.next()
  }

  if (!token && !isAuthPage) {
    logRequest(request, 302)
    return NextResponse.redirect(new URL("/login", request.url))
  }

  logRequest(request, 200)
  return NextResponse.next()
}

// 修改 matcher 配置，明确排除 public 目录下的图片
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - images (image files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|images).*)",
  ],
}

