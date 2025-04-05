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

    // Get user's friends
    const friendships = await db
      .collection("friendships")
      .find({
        $or: [
          { userId1: session.userId, status: "accepted" },
          { userId2: session.userId, status: "accepted" },
        ],
      })
      .toArray()

    // Get friend IDs
    const friendIds = friendships.map((friendship) => {
      return friendship.userId1 === session.userId ? friendship.userId2 : friendship.userId1
    })

    // Get friend details
    const friends = await db
      .collection("users")
      .find({ _id: { $in: friendIds.map((id) => new ObjectId(id)) } }, { projection: { password: 0 } })
      .toArray()

    // Get pending friend requests
    const pendingRequests = await db
      .collection("friendships")
      .find({
        userId2: session.userId,
        status: "pending",
      })
      .toArray()

    // Get pending request user details
    const pendingRequestIds = pendingRequests.map((request) => request.userId1)
    const pendingRequestUsers = await db
      .collection("users")
      .find({ _id: { $in: pendingRequestIds.map((id) => new ObjectId(id)) } }, { projection: { password: 0 } })
      .toArray()

    return NextResponse.json({
      friends: friends.map((friend) => ({
        ...friend,
        _id: friend._id.toString(),
      })),
      pendingRequests: pendingRequestUsers.map((user) => ({
        ...user,
        _id: user._id.toString(),
        requestId: pendingRequests.find((req) => req.userId1 === user._id.toString())?._id,
      })),
    })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
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
    if (!data.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await db.collection("users").findOne({ _id: new ObjectId(data.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if friendship already exists
    const existingFriendship = await db.collection("friendships").findOne({
      $or: [
        { userId1: session.userId, userId2: data.userId },
        { userId1: data.userId, userId2: session.userId },
      ],
    })

    if (existingFriendship) {
      return NextResponse.json({ error: "Friend request already exists" }, { status: 400 })
    }

    // Create friend request
    const friendRequest = {
      userId1: session.userId, // requester
      userId2: data.userId, // recipient
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("friendships").insertOne(friendRequest)

    return NextResponse.json({
      _id: result.insertedId,
      ...friendRequest,
    })
  } catch (error) {
    console.error("Error sending friend request:", error)
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
  }
}

