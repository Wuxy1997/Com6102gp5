import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Define achievement criteria and rules
const achievementDefinitions = [
  {
    id: "first_workout",
    name: "First Workout",
    description: "Complete your first workout",
    icon: "award",
    points: 10,
    check: (userData: any) => userData.exerciseCount >= 1,
  },
  {
    id: "workout_streak_7",
    name: "7-Day Streak",
    description: "Complete workouts for 7 consecutive days",
    icon: "flame",
    points: 50,
    check: (userData: any) => userData.longestStreak >= 7,
  },
  {
    id: "workout_variety",
    name: "Exercise Variety",
    description: "Try 5 different types of exercises",
    icon: "layers",
    points: 30,
    check: (userData: any) => userData.exerciseTypes.length >= 5,
  },
  {
    id: "nutrition_tracking",
    name: "Nutrition Master",
    description: "Log your meals for 10 days",
    icon: "utensils",
    points: 40,
    check: (userData: any) => userData.foodLogDays >= 10,
  },
  {
    id: "weight_goal",
    name: "Goal Achiever",
    description: "Reach your weight goal",
    icon: "target",
    points: 100,
    check: (userData: any) => userData.reachedWeightGoal,
  },
  {
    id: "calorie_burn_1000",
    name: "Calorie Burner",
    description: "Burn a total of 1000 calories through exercise",
    icon: "flame",
    points: 30,
    check: (userData: any) => userData.totalCaloriesBurned >= 1000,
  },
  {
    id: "exercise_time_300",
    name: "Dedicated Athlete",
    description: "Complete 300 minutes of exercise",
    icon: "timer",
    points: 40,
    check: (userData: any) => userData.totalWorkoutMinutes >= 300,
  },
  {
    id: "weight_loss_5",
    name: "Progress Maker",
    description: "Lose 5kg from your starting weight",
    icon: "trending-down",
    points: 50,
    check: (userData: any) => userData.weightLossFromStart >= 5,
  },
  {
    id: "food_logging_streak_3",
    name: "Nutrition Tracker",
    description: "Log your food for 3 consecutive days",
    icon: "calendar",
    points: 20,
    check: (userData: any) => userData.consecutiveFoodLogDays >= 3,
  },
  // Add workout plan completion achievements
  {
    id: "first_plan_workout",
    name: "Plan Follower",
    description: "Complete your first workout from a workout plan",
    icon: "check-square",
    points: 15,
    check: (userData: any) => userData.workoutCompletions >= 1,
  },
  {
    id: "five_plan_workouts",
    name: "Committed",
    description: "Complete 5 workouts from workout plans",
    icon: "calendar-check",
    points: 30,
    check: (userData: any) => userData.workoutCompletions >= 5,
  },
  {
    id: "twenty_plan_workouts",
    name: "Dedicated",
    description: "Complete 20 workouts from workout plans",
    icon: "award",
    points: 50,
    check: (userData: any) => userData.workoutCompletions >= 20,
  },
  {
    id: "complete_week",
    name: "Week Crusher",
    description: "Complete all workouts in a week of a workout plan",
    icon: "check-circle",
    points: 40,
    check: (userData: any) => userData.hasCompletedFullWeek,
  },
]

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

    // Get user's achievements
    const userAchievements = await db.collection("user_achievements").find({ userId: session.userId }).toArray()

    // Get all available achievements with earned status
    const achievements = achievementDefinitions.map((achievement) => {
      const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)
      const earned = !!userAchievement

      return {
        id: achievement.id,
        _id: achievement.id, // Include both formats for consistency
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        earned,
        earnedAt: userAchievement?.earnedAt || null,
      }
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}

// This endpoint will be called by a scheduled job or after certain user actions
export async function POST() {
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

    // Get user data needed for achievement checks
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })

    // Get exercise data
    const exerciseData = await db.collection("exercise_data").find({ userId: session.userId }).toArray()

    // Get food log data
    const foodData = await db.collection("food_data").find({ userId: session.userId }).toArray()

    // Get workout completions
    const workoutCompletions = await db.collection("workout_completions").find({ userId: session.userId }).toArray()

    // Check if user has completed a full week of a workout plan
    const hasCompletedFullWeek = await checkForCompletedWeek(db, session.userId)

    // Calculate user stats for achievement checks
    const userData = {
      exerciseCount: exerciseData.length,
      exerciseTypes: [...new Set(exerciseData.map((e) => e.type))],
      foodLogDays: [...new Set(foodData.map((f) => new Date(f.date).toDateString()))].length,
      longestStreak: calculateLongestStreak(exerciseData),
      reachedWeightGoal: user.weightGoal && user.latestHealthData && user.latestHealthData.weight <= user.weightGoal,
      // Add more detailed stats
      totalWorkoutMinutes: exerciseData.reduce((sum, e) => sum + (e.duration || 0), 0),
      totalCaloriesBurned: exerciseData.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0),
      hasLoggedFoodToday: foodData.some((f) => new Date(f.date).toDateString() === new Date().toDateString()),
      consecutiveFoodLogDays: calculateConsecutiveDays(foodData),
      weightLossFromStart:
        user.initialWeight && user.latestHealthData ? user.initialWeight - user.latestHealthData.weight : 0,
      // Workout plan stats
      workoutCompletions: workoutCompletions.length,
      hasCompletedFullWeek,
    }

    // Get user's existing achievements
    const existingAchievements = await db.collection("user_achievements").find({ userId: session.userId }).toArray()

    const existingAchievementIds = existingAchievements.map((a) => a.achievementId)

    // Check for new achievements
    const newAchievements = []
    for (const achievement of achievementDefinitions) {
      if (!existingAchievementIds.includes(achievement.id) && achievement.check(userData)) {
        // User earned a new achievement
        const userAchievement = {
          userId: session.userId,
          achievementId: achievement.id,
          earnedAt: new Date(),
        }

        await db.collection("user_achievements").insertOne(userAchievement)
        newAchievements.push({
          ...achievement,
          earnedAt: userAchievement.earnedAt,
        })
      }
    }

    return NextResponse.json({
      newAchievements,
      totalAchievements: existingAchievementIds.length + newAchievements.length,
    })
  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 })
  }
}

// Helper function to calculate longest streak
function calculateLongestStreak(exerciseData: any[]) {
  if (exerciseData.length === 0) return 0

  // Sort by date
  const sortedData = [...exerciseData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Get unique dates
  const uniqueDates = [...new Set(sortedData.map((e) => new Date(e.date).toDateString()))]

  let currentStreak = 1
  let longestStreak = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1])
    const currDate = new Date(uniqueDates[i])

    // Check if dates are consecutive
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak
      }
    } else {
      currentStreak = 1
    }
  }

  return longestStreak
}

// Helper function to calculate consecutive days
function calculateConsecutiveDays(data: any[]) {
  if (data.length === 0) return 0

  // Sort by date
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get unique dates
  const uniqueDates = [...new Set(sortedData.map((e) => new Date(e.date).toDateString()))]

  let consecutiveDays = 1
  const today = new Date().toDateString()

  // Check if today is included
  if (uniqueDates[0] !== today) return 0

  // Check consecutive days from today
  for (let i = 1; i < uniqueDates.length; i++) {
    const currDate = new Date(uniqueDates[i - 1])
    const prevDate = new Date(uniqueDates[i])

    // Check if dates are consecutive
    const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      consecutiveDays++
    } else {
      break
    }
  }

  return consecutiveDays
}

// Helper function to check if a user has completed a full week of a workout plan
async function checkForCompletedWeek(db: any, userId: string) {
  // Get all workout plans
  const workoutPlans = await db.collection("workout_plans").find({}).toArray()

  // Get all completions for this user
  const completions = await db.collection("workout_completions").find({ userId }).toArray()

  // Check each plan
  for (const plan of workoutPlans) {
    for (let weekIndex = 0; weekIndex < plan.weeks.length; weekIndex++) {
      const week = plan.weeks[weekIndex]
      const dayCount = week.days.length

      // Count completions for this week
      const weekCompletions = completions.filter(
        (c: any) => c.workoutPlanId === plan._id.toString() && c.weekIndex === weekIndex,
      )

      // If all days in the week are completed, return true
      if (weekCompletions.length === dayCount && dayCount > 0) {
        return true
      }
    }
  }

  return false
}

