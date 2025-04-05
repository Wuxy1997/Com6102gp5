import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // Get workout plan
    const workoutPlan = await db.collection("workout_plans").findOne({
      _id: new ObjectId(params.id),
    })

    if (!workoutPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }

    // Check if user has access to this plan
    if (workoutPlan.userId !== session.userId && !workoutPlan.isPublic) {
      return NextResponse.json({ error: "You don't have access to this workout plan" }, { status: 403 })
    }

    return NextResponse.json(workoutPlan)
  } catch (error) {
    console.error("Error fetching workout plan:", error)
    return NextResponse.json({ error: "Failed to fetch workout plan" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Get workout plan
    const workoutPlan = await db.collection("workout_plans").findOne({
      _id: new ObjectId(params.id),
    })

    if (!workoutPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }

    // Check if user owns this plan
    if (workoutPlan.userId !== session.userId) {
      return NextResponse.json({ error: "You don't have permission to edit this workout plan" }, { status: 403 })
    }

    const data = await request.json()

    // Validate data
    if (!data.name || !data.weeks || !data.weeks.length) {
      return NextResponse.json({ error: "Plan name and at least one week of workouts are required" }, { status: 400 })
    }

    // Update workout plan
    const updatedWorkoutPlan = {
      name: data.name,
      description: data.description || "",
      weeks: data.weeks,
      difficulty: data.difficulty || "intermediate",
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      updatedAt: new Date(),
    }

    await db.collection("workout_plans").updateOne({ _id: new ObjectId(params.id) }, { $set: updatedWorkoutPlan })

    return NextResponse.json({
      _id: params.id,
      userId: workoutPlan.userId,
      createdAt: workoutPlan.createdAt,
      ...updatedWorkoutPlan,
    })
  } catch (error) {
    console.error("Error updating workout plan:", error)
    return NextResponse.json({ error: "Failed to update workout plan" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Get workout plan
    const workoutPlan = await db.collection("workout_plans").findOne({
      _id: new ObjectId(params.id),
    })

    if (!workoutPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }

    // Check if user owns this plan
    if (workoutPlan.userId !== session.userId) {
      return NextResponse.json({ error: "You don't have permission to delete this workout plan" }, { status: 403 })
    }

    // Delete workout plan
    await db.collection("workout_plans").deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workout plan:", error)
    return NextResponse.json({ error: "Failed to delete workout plan" }, { status: 500 })
  }
}

