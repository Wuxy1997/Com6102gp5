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

    // Get user's goals
    const goals = await db.collection("goals").find({ userId: session.userId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
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
    if (!data.type || !data.target) {
      return NextResponse.json({ error: "Goal type and target are required" }, { status: 400 })
    }

    // Validate goal type
    const validTypes = ["weight", "exercise", "sleep", "nutrition", "water", "steps", "calories", "custom"]
    if (!validTypes.includes(data.type)) {
      return NextResponse.json({ error: "Invalid goal type" }, { status: 400 })
    }

    // Create goal
    const goal = {
      userId: session.userId,
      type: data.type,
      name: data.name || `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Goal`,
      target: data.target,
      current: data.current || 0,
      unit: data.unit || "",
      deadline: data.deadline ? new Date(data.deadline) : null,
      notes: data.notes || "",
      isCompleted: false,
      progress: Math.min(100, Math.round((data.current / data.target) * 100)) || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("goals").insertOne(goal)

    return NextResponse.json({
      _id: result.insertedId,
      ...goal,
    })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
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
    if (!data._id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
    }

    // Get the goal
    const goal = await db.collection("goals").findOne({
      _id: new ObjectId(data._id),
      userId: session.userId,
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Update goal
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.target !== undefined) updateData.target = data.target
    if (data.current !== undefined) updateData.current = data.current
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted

    // Calculate progress
    if (data.current !== undefined && data.target !== undefined) {
      updateData.progress = Math.min(100, Math.round((data.current / data.target) * 100))
    } else if (data.current !== undefined) {
      updateData.progress = Math.min(100, Math.round((data.current / goal.target) * 100))
    }

    await db.collection("goals").updateOne({ _id: new ObjectId(data._id) }, { $set: updateData })

    return NextResponse.json({
      success: true,
      _id: data._id,
      ...goal,
      ...updateData,
    })
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionId = cookies().get("sessionId")?.value
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Find session
    const session = await db.collection("sessions").findOne({ _id: sessionId })

    if (!session || new Date(session.expiresAt) < new Date()) {
      cookies().delete("sessionId")
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    // Delete goal
    const result = await db.collection("goals").deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}

