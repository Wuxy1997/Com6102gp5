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
    const { planId, weekIndex, dayIndex, intensity = "moderate", caloriesBurned } = data

    if (!planId || weekIndex === undefined || dayIndex === undefined) {
      return NextResponse.json({ error: "Plan ID, week index, and day index are required" }, { status: 400 })
    }

    // Get workout plan
    const workoutPlan = await db.collection("workout_plans").findOne({
      _id: new ObjectId(planId),
    })

    if (!workoutPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }

    // Check if user has access to this plan
    if (workoutPlan.userId !== session.userId && !workoutPlan.isPublic) {
      return NextResponse.json({ error: "You don't have access to this workout plan" }, { status: 403 })
    }

    // Check if the week and day exist in the plan
    if (!workoutPlan.weeks[weekIndex] || !workoutPlan.weeks[weekIndex].days[dayIndex]) {
      return NextResponse.json({ error: "Invalid week or day index" }, { status: 400 })
    }

    const day = workoutPlan.weeks[weekIndex].days[dayIndex]
    const weekName = workoutPlan.weeks[weekIndex].name
    const dayName = day.name

    // Calculate calories burned if not provided
    let calculatedCaloriesBurned = caloriesBurned
    if (!calculatedCaloriesBurned) {
      // Base calories on intensity and number of exercises
      const exerciseCount = day.exercises.length
      const intensityMultiplier = intensity === "light" ? 5 : intensity === "intense" ? 15 : 10 // moderate is default

      calculatedCaloriesBurned = exerciseCount * intensityMultiplier * 10
    }

    // Calculate exercise duration in minutes
    const calculateExerciseDuration = (exercise: any): number => {
      if (!exercise.startTime || !exercise.endTime) return 30 // Default to 30 minutes if no time set

      const [startHour, startMinute] = exercise.startTime.split(":").map(Number)
      const [endHour, endMinute] = exercise.endTime.split(":").map(Number)

      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute

      // Handle cases where end time is on the next day
      return endTotalMinutes >= startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : 24 * 60 - startTotalMinutes + endTotalMinutes
    }

    // Calculate total duration from all exercises in the workout
    const totalDuration = workoutPlan.weeks[weekIndex].days[dayIndex].exercises.reduce(
      (total, exercise) => total + calculateExerciseDuration(exercise),
      0,
    )

    // Calculate workout duration based on exercises
    // const exerciseCount = day.exercises.length
    // const durationMinutes = exerciseCount > 0 ? exerciseCount * 5 + 10 : 30 // Base duration on exercise count or default to 30 min

    // Record completion
    const completion = {
      userId: session.userId,
      workoutPlanId: planId,
      weekIndex,
      dayIndex,
      weekName,
      dayName,
      completedAt: new Date(),
      intensity,
      caloriesBurned: Number(calculatedCaloriesBurned),
      duration: totalDuration,
    }

    await db.collection("workout_completions").insertOne(completion)

    // Add to exercise records
    const exerciseRecord = {
      userId: session.userId,
      type: "workout",
      name: `${workoutPlan.name} - ${weekName} - ${dayName}`,
      date: new Date(),
      duration: totalDuration,
      caloriesBurned: Number(calculatedCaloriesBurned),
      notes: `Completed with ${intensity} intensity`,
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + totalDuration * 60000),
    }

    await db.collection("exercise_data").insertOne(exerciseRecord)

    // Check if user has any calorie goals and update progress
    const calorieGoals = await db
      .collection("goals")
      .find({
        userId: session.userId,
        type: "calories_burned",
        status: "active",
      })
      .toArray()

    for (const goal of calorieGoals) {
      // Update progress
      const newProgress = (goal.progress || 0) + Number(calculatedCaloriesBurned)
      const isCompleted = newProgress >= goal.target

      await db.collection("goals").updateOne(
        { _id: goal._id },
        {
          $set: {
            progress: newProgress,
            status: isCompleted ? "completed" : "active",
            completedAt: isCompleted ? new Date() : null,
            notified: false,
          },
        },
      )
    }

    // Check if user has any workout goals and update progress
    const workoutGoals = await db
      .collection("goals")
      .find({
        userId: session.userId,
        type: "workouts_completed",
        status: "active",
      })
      .toArray()

    for (const goal of workoutGoals) {
      // Update progress
      const newProgress = (goal.progress || 0) + 1
      const isCompleted = newProgress >= goal.target

      await db.collection("goals").updateOne(
        { _id: goal._id },
        {
          $set: {
            progress: newProgress,
            status: isCompleted ? "completed" : "active",
            completedAt: isCompleted ? new Date() : null,
            notified: false,
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      caloriesBurned: calculatedCaloriesBurned,
      duration: totalDuration,
    })
  } catch (error) {
    console.error("Error completing workout:", error)
    return NextResponse.json({ error: "Failed to mark workout as completed" }, { status: 500 })
  }
}

