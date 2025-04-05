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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // Get the plan to copy
    const planToCopy = await db.collection("workout_plans").findOne({
      _id: new ObjectId(planId),
    })

    if (!planToCopy) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }

    // Check if the plan is public or belongs to the user
    if (!planToCopy.isPublic && planToCopy.userId !== session.userId) {
      return NextResponse.json({ error: "You don't have permission to copy this plan" }, { status: 403 })
    }

    // Create a new plan based on the copied one
    const newPlan = {
      name: `Copy of ${planToCopy.name}`,
      description: planToCopy.description,
      weeks: planToCopy.weeks,
      difficulty: planToCopy.difficulty,
      tags: planToCopy.tags || [],
      isPublic: false, // Default to private for copied plans
      userId: session.userId,
      copiedFrom: {
        planId: planToCopy._id.toString(),
        userId: planToCopy.userId,
        date: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("workout_plans").insertOne(newPlan)

    return NextResponse.json({
      _id: result.insertedId,
      ...newPlan,
    })
  } catch (error) {
    console.error("Error copying workout plan:", error)
    return NextResponse.json({ error: "Failed to copy workout plan" }, { status: 500 })
  }
}

