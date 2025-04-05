import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
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

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")

    // Build query
    const query: any = { userId: session.userId }
    if (planId) {
      query.workoutPlanId = planId
    }

    // Get workout completions
    const completions = await db.collection("workout_completions").find(query).sort({ completedAt: -1 }).toArray()

    return NextResponse.json(completions)
  } catch (error) {
    console.error("Error fetching workout completions:", error)
    return NextResponse.json({ error: "Failed to fetch workout completions" }, { status: 500 })
  }
}

