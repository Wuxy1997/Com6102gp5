import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { AIService } from "@/lib/ai-service"

// 统一处理所有AI相关请求
export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()

    // 获取用户ID和验证
    const authCookie = req.cookies.get("auth")?.value
    if (!authCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [userId, _] = authCookie.split(":")
    if (!userId) {
      return NextResponse.json({ error: "Invalid auth cookie" }, { status: 401 })
    }

    // 获取用户数据
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
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
      const userData: any = {}

      // 根据类型获取相关数据
      if (type === "diet" || type === "general") {
        const foodData = await db.collection("foodRecords").find({ userId }).sort({ date: -1 }).limit(10).toArray()
        userData.foodData = foodData.map((data) => ({
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
          .find({ userId })
          .sort({ date: -1 })
          .limit(10)
          .toArray()
        userData.exerciseData = exerciseData.map((data) => ({
          date: new Date(data.date).toISOString().split("T")[0],
          type: data.type,
          duration: data.duration,
          caloriesBurned: data.caloriesBurned,
        }))
      }

      if (type === "sleep" || type === "general") {
        const healthData = await db.collection("healthData").find({ userId }).sort({ date: -1 }).limit(10).toArray()
        userData.healthData = healthData.map((data) => ({
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

