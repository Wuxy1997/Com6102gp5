import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const sessionId = cookies().get("sessionId")?.value

    console.log("Session ID from cookie:", sessionId)

    if (!sessionId) {
      console.log("No session ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Find session
    const session = await db.collection("sessions").findOne({ _id: sessionId })

    console.log("Session found:", session ? "Yes" : "No")

    if (!session || new Date(session.expiresAt) < new Date()) {
      console.log("Session expired or not found")
      cookies().delete("sessionId")
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    // Find user
    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.userId),
    })

    console.log("User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data (without password)
    return NextResponse.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}

