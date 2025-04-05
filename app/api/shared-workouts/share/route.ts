import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
    if (!data.workoutId && !data.customWorkout) {
      return NextResponse.json({ error: "Workout data is required" }, { status: 400 })
    }

    if (!data.sharedWith) {
      return NextResponse.json({ error: "Sharing scope is required" }, { status: 400 })
    }

    // Get user info
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { name: 1, email: 1 } })

    let workoutData

    if (data.workoutId) {
      // Get workout plan if sharing an existing one
      const workoutPlan = await db.collection("workout_plans").findOne({
        _id: new ObjectId(data.workoutId),
        userId: session.userId,
      })

      if (!workoutPlan) {
        return NextResponse.json({ error: "Workout plan not found or you don't have permission" }, { status: 404 })
      }

      workoutData = {
        title: workoutPlan.name,
        description: workoutPlan.description,
        exercises: workoutPlan.weeks.flatMap((week: any) => week.days.flatMap((day: any) => day.exercises)),
        originalWorkoutId: data.workoutId,
      }
    } else {
      // Use custom workout data
      workoutData = {
        title: data.customWorkout.title,
        description: data.customWorkout.description,
        exercises: data.customWorkout.exercises,
      }
    }

    // Create shared workout
    const sharedWorkout = {
      ...workoutData,
      sharedBy: {
        userId: session.userId,
        name: user.name,
        email: user.email,
      },
      sharedAt: new Date(),
      sharedWith: data.sharedWith, // "public", "friends", or "specific"
      sharedWithUsers: data.sharedWithUsers || [], // Array of user IDs if sharedWith is "specific"
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

