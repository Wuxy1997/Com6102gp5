import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
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

    const { goalIds } = await request.json()

    if (!goalIds || !Array.isArray(goalIds)) {
      return NextResponse.json({ error: "Goal IDs are required" }, { status: 400 })
    }

    // Mark goals as notified
    await db.collection("goals").updateMany(
      {
        _id: { $in: goalIds.map((id) => new ObjectId(id)) },
        userId: session.userId,
      },
      { $set: { notified: true } },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking goals as notified:", error)
    return NextResponse.json({ error: "Failed to mark goals as notified" }, { status: 500 })
  }
}

