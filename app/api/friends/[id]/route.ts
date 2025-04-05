import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

    const data = await request.json()

    // Validate data
    if (!data.status || !["accepted", "rejected"].includes(data.status)) {
      return NextResponse.json({ error: "Valid status (accepted or rejected) is required" }, { status: 400 })
    }

    // Get friendship
    const friendship = await db.collection("friendships").findOne({
      _id: new ObjectId(params.id),
    })

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 })
    }

    // Check if user is the recipient of the request
    if (friendship.userId2 !== session.userId) {
      return NextResponse.json({ error: "You can only respond to your own friend requests" }, { status: 403 })
    }

    // Update friendship status
    await db.collection("friendships").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: data.status,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error responding to friend request:", error)
    return NextResponse.json({ error: "Failed to respond to friend request" }, { status: 500 })
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

    // Get friendship
    const friendship = await db.collection("friendships").findOne({
      _id: new ObjectId(params.id),
    })

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 })
    }

    // Check if user is part of the friendship
    if (friendship.userId1 !== session.userId && friendship.userId2 !== session.userId) {
      return NextResponse.json({ error: "You can only remove your own friendships" }, { status: 403 })
    }

    // Delete friendship
    await db.collection("friendships").deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing friendship:", error)
    return NextResponse.json({ error: "Failed to remove friendship" }, { status: 500 })
  }
}

