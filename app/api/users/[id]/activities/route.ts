import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // Check if users are friends or if the user is viewing their own profile
    const isSelf = session.userId === params.id
    let isFriend = false

    if (!isSelf) {
      const friendship = await db.collection("friendships").findOne({
        $or: [
          { userId1: session.userId, userId2: params.id, status: "accepted" },
          { userId1: params.id, userId2: session.userId, status: "accepted" },
        ],
      })
      isFriend = !!friendship
    }

    // Only allow access to activities if users are friends or if the user is viewing their own profile
    if (!isSelf && !isFriend) {
      return NextResponse.json({ error: "Unauthorized to view this user's activities" }, { status: 403 })
    }

    // Get user's activities
    const activities = []

    // 1. Get exercise data
    const exerciseData = await db
      .collection("exercise_data")
      .find({ userId: params.id })
      .sort({ date: -1 })
      .limit(5)
      .toArray()

    for (const exercise of exerciseData) {
      activities.push({
        type: "exercise",
        title: `Completed ${exercise.type} exercise`,
        description: `Duration: ${exercise.duration} minutes, Calories: ${exercise.caloriesBurned}`,
        createdAt: exercise.date,
      })
    }

    // 2. Get food log data
    const foodData = await db.collection("food_data").find({ userId: params.id }).sort({ date: -1 }).limit(5).toArray()

    for (const food of foodData) {
      activities.push({
        type: "food",
        title: `Logged ${food.name}`,
        description: `Calories: ${food.calories}, Protein: ${food.protein}g`,
        createdAt: food.date,
      })
    }

    // 3. Get workout completions
    const workoutCompletions = await db
      .collection("workout_completions")
      .find({ userId: params.id })
      .sort({ completedAt: -1 })
      .limit(5)
      .toArray()

    for (const completion of workoutCompletions) {
      activities.push({
        type: "workout",
        title: `Completed a workout`,
        description: `From plan: ${completion.workoutPlanName || "Unknown plan"}`,
        createdAt: completion.completedAt,
      })
    }

    // 4. Get achievement completions
    const achievementCompletions = await db
      .collection("user_achievements")
      .find({ userId: params.id })
      .sort({ earnedAt: -1 })
      .limit(5)
      .toArray()

    for (const achievement of achievementCompletions) {
      activities.push({
        type: "achievement",
        title: `Earned achievement: ${achievement.name || "Unknown achievement"}`,
        description: achievement.description || "",
        createdAt: achievement.earnedAt,
      })
    }

    // Sort all activities by date (newest first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Return the 10 most recent activities
    return NextResponse.json(activities.slice(0, 10))
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return NextResponse.json({ error: "Failed to fetch user activities" }, { status: 500 })
  }
}

