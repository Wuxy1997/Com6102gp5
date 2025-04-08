import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { AIService } from "@/lib/ai-service"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface FoodRecord {
  date: Date
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface ExerciseRecord {
  date: Date
  type: string
  duration: number
  caloriesBurned: number
}

interface HealthRecord {
  date: Date
  weight: number
  height: number
  bloodPressure: string
  heartRate: number
  sleepHours: number
}

// 统一处理所有AI相关请求
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("health_app")

    // Get user data
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 解析请求数据
    const requestData = await req.json()
    const { action, message, type } = requestData

    // 根据action执行不同操作
    if (action === "chat") {
      // 处理聊天请求
      if (!message) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 })
      }

      const response = await AIService.generateChatResponse(message)
      return NextResponse.json({ response })
    } else if (action === "recommendations") {
      // 处理推荐请求
      // 获取用户数据
      const userData: {
        foodData?: FoodRecord[];
        exerciseData?: ExerciseRecord[];
        healthData?: HealthRecord[];
      } = {}

      // 根据类型获取相关数据
      if (type === "diet" || type === "general") {
        const foodData = await db.collection("foodRecords").find({ userId: user._id }).sort({ date: -1 }).limit(10).toArray()
        userData.foodData = foodData.map((data: FoodRecord) => ({
          date: new Date(data.date).toISOString().split("T")[0],
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        }))
      }

      if (type === "exercise" || type === "general") {
        const exerciseData = await db
          .collection("exerciseRecords")
          .find({ userId: user._id })
          .sort({ date: -1 })
          .limit(10)
          .toArray()
        userData.exerciseData = exerciseData.map((data: ExerciseRecord) => ({
          date: new Date(data.date).toISOString().split("T")[0],
          type: data.type,
          duration: data.duration,
          caloriesBurned: data.caloriesBurned,
        }))
      }

      if (type === "sleep" || type === "general") {
        const healthData = await db.collection("healthData").find({ userId: user._id }).sort({ date: -1 }).limit(10).toArray()
        userData.healthData = healthData.map((data: HealthRecord) => ({
          date: new Date(data.date).toISOString().split("T")[0],
          weight: data.weight,
          height: data.height,
          bloodPressure: data.bloodPressure,
          heartRate: data.heartRate,
          sleepHours: data.sleepHours,
        }))
      }

      const recommendations = await AIService.generateHealthRecommendations(userData, type)
      return NextResponse.json({ recommendations })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing AI request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

