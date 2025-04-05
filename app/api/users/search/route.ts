import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
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

    // Get search query
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 })
    }

    // Search for users
    const users = await db
      .collection("users")
      .find({
        $and: [
          { _id: { $ne: new ObjectId(session.userId) } }, // Exclude current user
          {
            $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
          },
        ],
      })
      .project({ _id: 1, name: 1, email: 1 })
      .limit(10)
      .toArray()

    // Get existing friendships
    const friendships = await db
      .collection("friendships")
      .find({
        $or: [
          { userId1: session.userId, userId2: { $in: users.map((u) => u._id.toString()) } },
          { userId2: session.userId, userId1: { $in: users.map((u) => u._id.toString()) } },
        ],
      })
      .toArray()

    // Add friendship status to users
    const usersWithStatus = users.map((user) => {
      const friendship = friendships.find(
        (f) =>
          (f.userId1 === session.userId && f.userId2 === user._id.toString()) ||
          (f.userId2 === session.userId && f.userId1 === user._id.toString()),
      )

      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        isFriend: friendship?.status === "accepted",
        requestSent: friendship?.status === "pending" && friendship.userId1 === session.userId,
        requestReceived: friendship?.status === "pending" && friendship.userId2 === session.userId,
      }
    })

    return NextResponse.json(usersWithStatus)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}

