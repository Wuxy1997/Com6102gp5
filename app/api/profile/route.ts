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

    // Get user profile
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { password: 0 } }, // Exclude password
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      bio: user.bio || "",
      height: user.height || "",
      weight: user.weight || "",
      age: user.age || "",
      gender: user.gender || "",
      fitnessGoal: user.fitnessGoal || "",
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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
    if (!data.name || !data.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if email is already used by another user
    const existingUser = await db.collection("users").findOne({
      email: data.email,
      _id: { $ne: new ObjectId(session.userId) },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
    }

    // Update user profile
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          name: data.name,
          email: data.email,
          bio: data.bio || "",
          height: data.height || "",
          weight: data.weight || "",
          age: data.age || "",
          gender: data.gender || "",
          fitnessGoal: data.fitnessGoal || "",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export async function DELETE() {
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

    // Delete user data
    await db.collection("health_data").deleteMany({ userId: session.userId })
    await db.collection("exercise_data").deleteMany({ userId: session.userId })
    await db.collection("ai_conversations").deleteMany({ userId: session.userId })

    // Delete sessions
    await db.collection("sessions").deleteMany({ userId: session.userId })

    // Finally, delete the user
    await db.collection("users").deleteOne({ _id: new ObjectId(session.userId) })

    // Delete the session cookie
    cookies().delete("sessionId")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

