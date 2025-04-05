import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

    // Get user's exercise data
    const exerciseData = await db
      .collection("exercise_data")
      .find({ userId: session.userId })
      .sort({ date: -1 })
      .limit(30)
      .toArray()

    return NextResponse.json(exerciseData)
  } catch (error) {
    console.error("Error fetching exercise data:", error)
    return NextResponse.json({ error: "Failed to fetch exercise data" }, { status: 500 })
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
    if (!data.type || !data.duration) {
      return NextResponse.json({ error: "Exercise type and duration are required" }, { status: 400 })
    }

    // Calculate duration in minutes if start and end times are provided
    let duration = Number.parseFloat(data.duration) || 0
    if (data.startTime && data.endTime) {
      const [startHour, startMinute] = data.startTime.split(":").map(Number)
      const [endHour, endMinute] = data.endTime.split(":").map(Number)

      const startMinutes = startHour * 60 + (startMinute || 0)
      const endMinutes = endHour * 60 + (endMinute || 0)

      // If end time is earlier than start time, assume it's the next day
      const durationMinutes =
        endMinutes < startMinutes ? 24 * 60 - startMinutes + endMinutes : endMinutes - startMinutes

      // Use the calculated duration instead of the provided one
      duration = durationMinutes
      console.log(`Calculated duration: ${duration} minutes from ${data.startTime} to ${data.endTime}`)
    }

    // Save exercise data
    const exerciseData = {
      userId: session.userId,
      date: new Date(data.date || new Date()),
      type: data.type,
      duration: duration,
      distance: data.distance ? Number.parseFloat(data.distance) : null,
      caloriesBurned: data.caloriesBurned ? Number.parseFloat(data.caloriesBurned) : Math.round(duration * 7),
      intensity: data.intensity || "moderate",
      notes: data.notes || "",
      createdAt: new Date(),
      startTime: data.startTime,
      endTime: data.endTime,
      isAutoCompleted: data.isAutoCompleted || false,
    }

    const result = await db.collection("exercise_data").insertOne(exerciseData)

    // Update user's latest exercise data
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(session.userId) }, { $set: { latestExerciseData: exerciseData } })

    // Check for achievements
    try {
      // Call the achievements endpoint to check for new achievements
      await fetch(`${request.headers.get("origin")}/api/achievements`, {
        method: "POST",
        headers: {
          Cookie: `sessionId=${sessionId}`,
        },
      })
    } catch (error) {
      console.error("Error checking achievements:", error)
      // Don't fail the request if achievement check fails
    }

    return NextResponse.json({
      _id: result.insertedId,
      ...exerciseData,
    })
  } catch (error) {
    console.error("Error saving exercise data:", error)
    return NextResponse.json({ error: "Failed to save exercise data" }, { status: 500 })
  }
}

