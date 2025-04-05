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

    // Get user's health data - increase limit to get more historical data
    const healthData = await db
      .collection("health_data")
      .find({ userId: session.userId })
      .sort({ date: -1 })
      .limit(100) // Increased from 30 to 100
      .toArray()

    return NextResponse.json(healthData)
  } catch (error) {
    console.error("Error fetching health data:", error)
    return NextResponse.json({ error: "Failed to fetch health data" }, { status: 500 })
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
    if (!data.weight || !data.height) {
      return NextResponse.json({ error: "Weight and height are required" }, { status: 400 })
    }

    // Calculate BMI
    const heightInMeters = Number.parseFloat(data.height) / 100
    const bmi = Number.parseFloat(data.weight) / (heightInMeters * heightInMeters)

    // Save health data
    const healthData = {
      userId: session.userId,
      date: new Date(data.date),
      weight: Number.parseFloat(data.weight),
      height: Number.parseFloat(data.height),
      bmi: Number.parseFloat(bmi.toFixed(2)),
      bloodPressureSystolic: data.bloodPressureSystolic ? Number.parseFloat(data.bloodPressureSystolic) : null,
      bloodPressureDiastolic: data.bloodPressureDiastolic ? Number.parseFloat(data.bloodPressureDiastolic) : null,
      heartRate: data.heartRate ? Number.parseFloat(data.heartRate) : null,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      createdAt: new Date(),
    }

    const result = await db.collection("health_data").insertOne(healthData)

    // Update user's latest health data
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(session.userId) }, { $set: { latestHealthData: healthData } })

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
      ...healthData,
    })
  } catch (error) {
    console.error("Error saving health data:", error)
    return NextResponse.json({ error: "Failed to save health data" }, { status: 500 })
  }
}

