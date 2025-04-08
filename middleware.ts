import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("sessionId")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"]
  const publicApiRoutes = ["/api/auth/login", "/api/auth/register", "/api/auth/me"]

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route)
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // If there's no session
  if (!sessionId) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // For other routes, redirect to login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // Allow access to protected routes if there's a session
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

