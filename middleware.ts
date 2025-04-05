import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 修改中间件以添加更多日志记录并解决跨域问题
export function middleware(request: NextRequest) {
  // 临时允许所有请求通过
  return NextResponse.next()

  // 原始代码注释掉
  /*
  const sessionId = request.cookies.get("sessionId")?.value
  console.log("Session cookie in middleware:", sessionId ? "Present" : "Missing")
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"]

  // API routes that handle their own authentication
  const apiRoutes = ["/api/"]

  // Check if the route is public or an API route
  const isPublicRoute = publicRoutes.some((route) => pathname === route)
  const isApiRoute = pathname.startsWith("/api/")

  // If it's a public route or API route, allow access
  if (isPublicRoute || isApiRoute) {
    return NextResponse.next()
  }

  // If there's no session and it's not a public route, redirect to login
  if (!sessionId) {
    console.log("No session, redirecting to login")
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Allow access to protected routes if there's a session
  return NextResponse.next()
  */
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

