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

    // Get weekly schedule
    const weeklySchedule = await db.collection("workout_plans").findOne({
      _id: new ObjectId(params.id),
      isWeeklySchedule: true,
    })

    if (!weeklySchedule) {
      return NextResponse.json({ error: "Weekly schedule not found" }, { status: 404 })
    }

    // Check if user has access to this schedule
    if (weeklySchedule.userId !== session.userId) {
      return NextResponse.json({ error: "You don't have access to this weekly schedule" }, { status: 403 })
    }

    return NextResponse.json(weeklySchedule)
  } catch (error) {
    console.error("Error fetching weekly schedule:", error)
    return NextResponse.json({ error: "Failed to fetch weekly schedule" }, { status: 500 })
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

    // Get weekly schedule
    const weeklySchedule = await db.collection("workout_plans").findOne({
      _id: new ObjectId(params.id),
      isWeeklySchedule: true,
    })

    if (!weeklySchedule) {
      return NextResponse.json({ error: "Weekly schedule not found" }, { status: 404 })
    }

    // Check if user owns this schedule
    if (weeklySchedule.userId !== session.userId) {
      return NextResponse.json({ error: "You don't have permission to edit this weekly schedule" }, { status: 403 })
    }

    const data = await request.json()

    // Validate data
    if (!data.name || !data.weeks || !data.weeks.length) {
      return NextResponse.json(
        { error: "Schedule name and at least one week of workouts are required" },
        { status: 400 },
      )
    }

    // Update weekly schedule
    const updatedWeeklySchedule = {
      name: data.name,
      description: data.description || "",
      weeks: data.weeks,
      difficulty: data.difficulty || "intermediate",
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      isWeeklySchedule: true,
      isCalendarView: true,
      updatedAt: new Date(),
    }

    await db.collection("workout_plans").updateOne({ _id: new ObjectId(params.id) }, { $set: updatedWeeklySchedule })

    return NextResponse.json({
      _id: params.id,
      userId: weeklySchedule.userId,
      createdAt: weeklySchedule.createdAt,
      ...updatedWeeklySchedule,
    })
  } catch (error) {
    console.error("Error updating weekly schedule:", error)
    return NextResponse.json({ error: "Failed to update weekly schedule" }, { status: 500 })
  }
}

