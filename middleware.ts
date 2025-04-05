import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("sessionId")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/api/auth/login", "/api/auth/register"]

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If there's no session and it's not a public route, redirect to login
  if (!sessionId) {
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

