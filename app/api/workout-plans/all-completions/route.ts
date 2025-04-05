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

    // Get all workout completions for the user
    const completions = await db
      .collection("workout_completions")
      .find({ userId: session.userId })
      .sort({ completedAt: -1 })
      .toArray()

    return NextResponse.json(completions)
  } catch (error) {
    console.error("Error fetching all workout completions:", error)
    return NextResponse.json({ error: "Failed to fetch workout completions" }, { status: 500 })
  }
}

