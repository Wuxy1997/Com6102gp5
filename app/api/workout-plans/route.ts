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

    // Get user's workout plans
    const workoutPlans = await db
      .collection("workout_plans")
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(workoutPlans)
  } catch (error) {
    console.error("Error fetching workout plans:", error)
    return NextResponse.json({ error: "Failed to fetch workout plans" }, { status: 500 })
  }
}

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

    const data = await request.json()

    // Validate data
    if (!data.name || !data.weeks || !data.weeks.length) {
      return NextResponse.json({ error: "Plan name and at least one week of workouts are required" }, { status: 400 })
    }

    // Save workout plan
    const workoutPlan = {
      userId: session.userId,
      name: data.name,
      description: data.description || "",
      weeks: data.weeks,
      difficulty: data.difficulty || "intermediate",
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("workout_plans").insertOne(workoutPlan)

    return NextResponse.json({
      _id: result.insertedId,
      ...workoutPlan,
    })
  } catch (error) {
    console.error("Error saving workout plan:", error)
    return NextResponse.json({ error: "Failed to save workout plan" }, { status: 500 })
  }
}

