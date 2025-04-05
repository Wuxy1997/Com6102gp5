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

    // Get user's weekly schedule
    const weeklySchedule = await db.collection("workout_plans").findOne({
      userId: session.userId,
      isWeeklySchedule: true,
    })

    if (!weeklySchedule) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      schedule: weeklySchedule,
    })
  } catch (error) {
    console.error("Error fetching weekly schedule:", error)
    return NextResponse.json({ error: "Failed to fetch weekly schedule" }, { status: 500 })
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

    // Check if user already has a weekly schedule
    const existingSchedule = await db.collection("workout_plans").findOne({
      userId: session.userId,
      isWeeklySchedule: true,
    })

    if (existingSchedule) {
      return NextResponse.json(
        {
          error: "You already have a weekly schedule",
          scheduleId: existingSchedule._id,
        },
        { status: 400 },
      )
    }

    const data = await request.json()

    // Validate data
    if (!data.name || !data.weeks || !data.weeks.length) {
      return NextResponse.json(
        { error: "Schedule name and at least one week of workouts are required" },
        { status: 400 },
      )
    }

    // Save weekly schedule
    const weeklySchedule = {
      userId: session.userId,
      name: data.name,
      description: data.description || "",
      weeks: data.weeks,
      difficulty: data.difficulty || "intermediate",
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      isWeeklySchedule: true,
      isCalendarView: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("workout_plans").insertOne(weeklySchedule)

    return NextResponse.json({
      _id: result.insertedId,
      ...weeklySchedule,
    })
  } catch (error) {
    console.error("Error saving weekly schedule:", error)
    return NextResponse.json({ error: "Failed to save weekly schedule" }, { status: 500 })
  }
}

