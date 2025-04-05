import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// This endpoint will be called by a scheduled job or client-side to check and auto-complete workouts
export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("health_app")

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get current date and time
    const now = new Date()
    const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()]
    const currentHour = now.getHours()

    // Find all calendar workout plans for this user
    const calendarWorkouts = await db
      .collection("workout_plans")
      .find({
        userId: userId,
        isCalendarView: true,
      })
      .toArray()

    const completedWorkouts = []

    for (const plan of calendarWorkouts) {
      if (!plan.weeks || !plan.weeks.length) continue

      // Find the day in the plan that matches today
      const todayWorkouts = plan.weeks[0].days.find((day) => day.name === currentDay)

      if (!todayWorkouts || !todayWorkouts.exercises || !todayWorkouts.exercises.length) continue

      // Check each exercise to see if its end time has passed
      for (const exercise of todayWorkouts.exercises) {
        if (!exercise.startTime || !exercise.endTime) continue

        // Parse the end time
        const [endHour, endMinute] = exercise.endTime.split(":").map(Number)

        // If the current time is past the end time and the exercise hasn't been completed yet
        if (currentHour > endHour || (currentHour === endHour && now.getMinutes() > endMinute)) {
          // Check if this exercise has already been completed today
          const existingCompletion = await db.collection("workout_completions").findOne({
            userId: userId,
            workoutPlanId: plan._id.toString(),
            exerciseName: exercise.name,
            completedAt: {
              $gte: new Date(now.setHours(0, 0, 0, 0)),
              $lt: new Date(now.setHours(23, 59, 59, 999)),
            },
          })

          if (!existingCompletion) {
            // Calculate accurate duration in minutes
            const [startHour, startMinute] = exercise.startTime.split(":").map(Number)
            const startMinutes = startHour * 60 + startMinute
            const endMinutes = endHour * 60 + endMinute
            const durationMinutes = endMinutes - startMinutes

            // Calculate calories burned (approximately 5-10 calories per minute depending on intensity)
            const caloriesBurned = Math.round(durationMinutes * 7)

            // Create completion record
            const completionRecord = {
              userId: userId,
              workoutPlanId: plan._id.toString(),
              exerciseName: exercise.name,
              weekIndex: 0,
              dayIndex: plan.weeks[0].days.indexOf(todayWorkouts),
              weekName: plan.weeks[0].name || "Week 1",
              dayName: currentDay,
              completedAt: new Date(),
              intensity: "moderate",
              caloriesBurned: caloriesBurned,
              notes: "Auto-completed from calendar schedule",
              isAutoCompleted: true,
            }

            await db.collection("workout_completions").insertOne(completionRecord)

            // Record this workout completion as an exercise entry with accurate duration
            // Calculate duration from the workout's scheduled start and end times
            let calculatedDuration = 0
            if (exercise.startTime && exercise.endTime) {
              const [startHour, startMinute] = exercise.startTime.split(":").map(Number)
              const [endHour, endMinute] = exercise.endTime.split(":").map(Number)

              const startMinutes = startHour * 60 + (startMinute || 0)
              const endMinutes = endHour * 60 + (endMinute || 0)

              // If end time is earlier than start time, assume it's the next day
              calculatedDuration =
                endMinutes < startMinutes ? 24 * 60 - startMinutes + endMinutes : endMinutes - startMinutes
            } else {
              // If no start/end times, use the workout's planned duration
              calculatedDuration = exercise.duration || 30 // Default to 30 minutes if no duration specified
            }

            // Use the calculated duration in the exercise data
            const exerciseData = {
              userId: userId,
              date: new Date(),
              type: "workout",
              duration: calculatedDuration,
              distance: null,
              caloriesBurned: Math.round(calculatedDuration * 7),
              intensity: 3, // Moderate intensity
              notes: `Auto-completed ${exercise.name} from "${plan.name}" calendar schedule`,
              createdAt: new Date(),
              isAutoCompleted: true,
            }

            await db.collection("exercise_data").insertOne(exerciseData)

            completedWorkouts.push({
              planName: plan.name,
              exerciseName: exercise.name,
              duration: durationMinutes,
              caloriesBurned: caloriesBurned,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      completedWorkouts: completedWorkouts,
    })
  } catch (error) {
    console.error("Error auto-completing workouts:", error)
    return NextResponse.json({ error: "Failed to auto-complete workouts" }, { status: 500 })
  }
}

