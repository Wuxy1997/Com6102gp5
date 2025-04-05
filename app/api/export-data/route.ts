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

    // Get user data
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { password: 0 } }, // Exclude password
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get health data
    const healthData = await db.collection("health_data").find({ userId: session.userId }).sort({ date: -1 }).toArray()

    // Get exercise data
    const exerciseData = await db
      .collection("exercise_data")
      .find({ userId: session.userId })
      .sort({ date: -1 })
      .toArray()

    // Get AI conversations
    const aiConversations = await db
      .collection("ai_conversations")
      .find({ userId: session.userId })
      .sort({ timestamp: -1 })
      .toArray()

    // Compile all data
    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio || "",
        height: user.height || "",
        weight: user.weight || "",
        age: user.age || "",
        gender: user.gender || "",
        fitnessGoal: user.fitnessGoal || "",
        createdAt: user.createdAt,
        settings: user.settings || {},
      },
      healthData,
      exerciseData,
      aiConversations,
      exportDate: new Date(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

