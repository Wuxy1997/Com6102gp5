import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"

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

    const { activity } = await request.json()

    if (!activity || !activity.type || !activity.exerciseType) {
      return NextResponse.json({ error: "Invalid activity data" }, { status: 400 })
    }

    // Find or create a default workout plan for the user
    let workoutPlan = await db.collection("workout_plans").findOne({
      userId: session.userId,
      isDefault: true,
    })

    if (!workoutPlan) {
      // Create a default workout plan if none exists
      const newPlan = {
        userId: session.userId,
        name: "My Workout Plan",
        description: "Activities added from friends",
        weeks: [
          {
            name: "Week 1",
            days: [
              {
                name: "Day 1",
                exercises: [],
              },
            ],
          },
        ],
        difficulty: "intermediate",
        tags: ["personal"],
        isPublic: false,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("workout_plans").insertOne(newPlan)
      workoutPlan = {
        _id: result.insertedId,
        ...newPlan,
      }
    }

    // Create an exercise from the activity
    const exercise = {
      name: activity.exerciseType,
      sets: "3",
      reps: "10",
      notes: `Added from friend's activity (${activity.duration} minutes)`,
    }

    // Add the exercise to the first day of the first week
    await db.collection("workout_plans").updateOne(
      { _id: workoutPlan._id },
      {
        $push: { "weeks.0.days.0.exercises": exercise },
        $set: { updatedAt: new Date() },
      },
    )

    // Also add to exercise data
    const exerciseData = {
      userId: session.userId,
      date: new Date(),
      type: activity.exerciseType,
      duration: activity.duration,
      intensity: 3,
      notes: "Added from friend's activity",
      createdAt: new Date(),
    }

    await db.collection("exercise_data").insertOne(exerciseData)

    return NextResponse.json({
      success: true,
      message: "Activity added to workout plan",
      workoutPlanId: workoutPlan._id.toString(),
    })
  } catch (error) {
    console.error("Error adding activity to workout plan:", error)
    return NextResponse.json({ error: "Failed to add activity to workout plan" }, { status: 500 })
  }
}

