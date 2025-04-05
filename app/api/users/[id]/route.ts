import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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

    console.log("Fetching profile for user ID:", params.id)

    // Validate ObjectId format
    let userId
    try {
      userId = new ObjectId(params.id)
    } catch (error) {
      console.error("Invalid ObjectId format:", params.id)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Get user profile
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0, settings: 0 } }, // Exclude sensitive information
    )

    if (!user) {
      console.error("User not found:", params.id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", user.name)

    // Check if users are friends
    const friendship = await db.collection("friendships").findOne({
      $or: [
        { userId1: session.userId, userId2: params.id, status: "accepted" },
        { userId1: params.id, userId2: session.userId, status: "accepted" },
      ],
    })

    console.log("Are friends:", !!friendship)

    // Check if friend request is pending
    const pendingRequest = await db.collection("friendships").findOne({
      userId1: session.userId,
      userId2: params.id,
      status: "pending",
    })

    // Get user's public workout plans
    const workoutPlans = await db
      .collection("workout_plans")
      .find({ userId: params.id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    console.log("Found workout plans:", workoutPlans.length)

    // Get user's recent activities (only if friends or self)
    let recentActivities = []
    if (friendship || session.userId === params.id) {
      // Get recent exercise data
      const exerciseData = await db
        .collection("exercise_data")
        .find({ userId: params.id })
        .sort({ date: -1 })
        .limit(5)
        .toArray()

      recentActivities = exerciseData.map((activity) => ({
        type: "exercise",
        date: activity.date,
        details: {
          exerciseType: activity.type,
          duration: activity.duration,
          distance: activity.distance,
          intensity: activity.intensity,
          caloriesBurned: activity.caloriesBurned,
          notes: activity.notes,
        },
      }))
    }

    // Get user's achievements (only if friends or self)
    let achievements = []
    if (friendship || session.userId === params.id) {
      // Define achievement definitions
      const achievementDefinitions = [
        {
          id: "first_workout",
          name: "First Workout",
          description: "Complete your first workout",
          icon: "award",
          points: 10,
        },
        {
          id: "workout_streak_7",
          name: "7-Day Streak",
          description: "Complete workouts for 7 consecutive days",
          icon: "flame",
          points: 50,
        },
        {
          id: "workout_variety",
          name: "Exercise Variety",
          description: "Try 5 different types of exercises",
          icon: "layers",
          points: 30,
        },
        {
          id: "nutrition_tracking",
          name: "Nutrition Master",
          description: "Log your meals for 10 days",
          icon: "utensils",
          points: 40,
        },
        {
          id: "weight_goal",
          name: "Goal Achiever",
          description: "Reach your weight goal",
          icon: "target",
          points: 100,
        },
        {
          id: "calorie_burn_1000",
          name: "Calorie Burner",
          description: "Burn a total of 1000 calories through exercise",
          icon: "flame",
          points: 30,
        },
        {
          id: "exercise_time_300",
          name: "Dedicated Athlete",
          description: "Complete 300 minutes of exercise",
          icon: "timer",
          points: 40,
        },
        {
          id: "weight_loss_5",
          name: "Progress Maker",
          description: "Lose 5kg from your starting weight",
          icon: "trending-down",
          points: 50,
        },
        {
          id: "food_logging_streak_3",
          name: "Nutrition Tracker",
          description: "Log your food for 3 consecutive days",
          icon: "calendar",
          points: 20,
        },
        {
          id: "first_plan_workout",
          name: "Plan Follower",
          description: "Complete your first workout from a workout plan",
          icon: "check-square",
          points: 15,
        },
        {
          id: "five_plan_workouts",
          name: "Committed",
          description: "Complete 5 workouts from workout plans",
          icon: "calendar-check",
          points: 30,
        },
        {
          id: "twenty_plan_workouts",
          name: "Dedicated",
          description: "Complete 20 workouts from workout plans",
          icon: "award",
          points: 50,
        },
        {
          id: "complete_week",
          name: "Week Crusher",
          description: "Complete all workouts in a week of a workout plan",
          icon: "check-circle",
          points: 40,
        },
      ]

      // Get user's earned achievements
      const userAchievements = await db.collection("user_achievements").find({ userId: params.id }).toArray()

      console.log("Found user achievements:", userAchievements.length)

      // Map achievements with earned status
      achievements = achievementDefinitions.map((achievement) => {
        const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id)
        return {
          id: achievement.id,
          _id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
          earned: !!userAchievement,
          earnedAt: userAchievement ? userAchievement.earnedAt : null,
        }
      })
    }

    // Format the response
    const profileData = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio || "",
      fitnessGoal: user.fitnessGoal || "",
      isFriend: !!friendship, // Explicitly set isFriend flag
      isPendingFriend: !!pendingRequest,
      isSelf: session.userId === params.id,
      createdAt: user.createdAt || new Date().toISOString(),
      workoutPlans,
      recentActivities,
      achievements,
    }

    console.log("Returning profile data with friendship status:", !!friendship)
    return NextResponse.json(profileData)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

