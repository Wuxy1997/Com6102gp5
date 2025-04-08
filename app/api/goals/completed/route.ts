import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const sessionId = cookies().get("sessionId")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Find session
    const session = await db.collection("sessions").findOne({ _id: sessionId })

    if (!session || new Date(session.expiresAt) < new Date()) {
      cookies().delete("sessionId")
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    // Find newly completed goals that haven't been notified yet
    const completedGoals = await db
      .collection("goals")
      .find({
        userId: session.userId,
        isCompleted: true,
        notified: { $ne: true },
      })
      .toArray()

    return NextResponse.json({ completedGoals })
  } catch (error) {
    console.error("Error fetching completed goals:", error)
    return NextResponse.json({ error: "Failed to fetch completed goals" }, { status: 500 })
  }
}

