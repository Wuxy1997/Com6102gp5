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

    // Get shared workouts from friends
    const sharedWorkouts = await db
      .collection("shared_workouts")
      .find({
        "sharedBy.userId": { $in: friendIds },
        $or: [{ sharedWith: "public" }, { sharedWith: "friends" }, { sharedWithUsers: session.userId }],
      })
      .sort({ sharedAt: -1 })
      .toArray()

    // If no shared workouts collection or no data yet, return sample data
    if (sharedWorkouts.length === 0) {
      // For demo purposes, return some sample data if no real data exists
      return NextResponse.json([
        {
          _id: "sample1",
          title: "Full Body Workout",
          description: "A complete full body workout focusing on strength and endurance",
          sharedBy: {
            _id: friendIds[0] || "sample-user-1",
            name: "Sample User",
          },
          sharedAt: new Date().toISOString(),
          exercises: [
            { name: "Squats", sets: 3, reps: 12 },
            { name: "Push-ups", sets: 3, reps: 15 },
            { name: "Deadlifts", sets: 3, reps: 10, weight: "60" },
          ],
        },
        {
          _id: "sample2",
          title: "HIIT Cardio Session",
          description: "High intensity interval training to boost metabolism",
          sharedBy: {
            _id: friendIds[0] || "sample-user-2",
            name: "Another Friend",
          },
          sharedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          exercises: [
            { name: "Jumping Jacks", sets: 3, reps: 30 },
            { name: "Mountain Climbers", sets: 3, reps: 20 },
            { name: "Burpees", sets: 3, reps: 10 },
          ],
        },
      ])
    }

    return NextResponse.json(sharedWorkouts)
  } catch (error) {
    console.error("Error fetching shared workouts:", error)
    return NextResponse.json({ error: "Failed to fetch shared workouts" }, { status: 500 })
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

    // Get user info
    const user = await db.collection("users").findOne({ _id: session.userId })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create shared workout
    const sharedWorkout = {
      title: data.title,
      description: data.description || "",
      exercises: data.exercises || [],
      sharedBy: {
        userId: session.userId,
        name: user.name,
      },
      sharedWith: data.sharedWith || "friends", // "public", "friends", or "specific"
      sharedWithUsers: data.sharedWithUsers || [],
      sharedAt: new Date(),
    }

    const result = await db.collection("shared_workouts").insertOne(sharedWorkout)

    return NextResponse.json({
      _id: result.insertedId,
      ...sharedWorkout,
    })
  } catch (error) {
    console.error("Error sharing workout:", error)
    return NextResponse.json({ error: "Failed to share workout" }, { status: 500 })
  }
}

