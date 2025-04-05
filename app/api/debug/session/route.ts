import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // 获取所有cookie
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // 获取sessionId
    const sessionId = cookieStore.get("sessionId")?.value

    return NextResponse.json({
      message: "Session debug information",
      sessionExists: !!sessionId,
      sessionId: sessionId || "Not found",
      allCookies: allCookies.map((c) => ({
        name: c.name,
        value: c.value ? "Present" : "Empty",
        path: c.path,
        sameSite: c.sameSite,
      })),
    })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json({ error: "Failed to debug session" }, { status: 500 })
  }
}

