import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { AIService } from "@/lib/ai-service"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

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

// 定义数据模型
const FoodRecordSchema = z.object({
  date: z.date(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

const ExerciseRecordSchema = z.object({
  date: z.date(),
  type: z.string(),
  duration: z.number(),
  caloriesBurned: z.number(),
})

const HealthRecordSchema = z.object({
  date: z.date(),
  weight: z.number(),
  height: z.number(),
  bloodPressure: z.string(),
  heartRate: z.number(),
  sleepHours: z.number(),
})

// 定义请求验证模式
const ChatRequestSchema = z.object({
  action: z.literal("chat"),
  message: z.string().min(1, "Message is required"),
})

const RecommendationsRequestSchema = z.object({
  action: z.literal("recommendations"),
  type: z.enum(["diet", "exercise", "sleep", "general"]).default("general"),
})

const RequestSchema = z.discriminatedUnion("action", [
  ChatRequestSchema,
  RecommendationsRequestSchema,
])

// 统一处理所有AI相关请求
export async function POST(req: NextRequest) {
  try {
    // 验证会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 获取数据库连接
    const client = await clientPromise
    const db = client.db("health_app")

    // 获取用户数据
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 解析和验证请求数据
    const requestData = await req.json()
    const validationResult = RequestSchema.safeParse(requestData)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { action, type } = validationResult.data

    // 根据action执行不同操作
    if (action === "chat") {
      const { message } = validationResult.data
      
      // 记录请求
      console.log(`[AI Chat] User: ${user.email}, Message: ${message}`)
      
      const response = await AIService.generateChatResponse(message)
      return NextResponse.json({ response })
    } else if (action === "recommendations") {
      // 处理推荐请求
      const userData: {
        foodData?: z.infer<typeof FoodRecordSchema>[];
        exerciseData?: z.infer<typeof ExerciseRecordSchema>[];
        healthData?: z.infer<typeof HealthRecordSchema>[];
      } = {}

      // 根据类型获取相关数据
      if (type === "diet" || type === "general") {
        const foodData = await db
          .collection("foodRecords")
          .find({ userId: user._id })
          .sort({ date: -1 })
          .limit(10)
          .toArray()
        
        userData.foodData = foodData.map((data) => ({
          date: new Date(data.date),
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
        
        userData.exerciseData = exerciseData.map((data) => ({
          date: new Date(data.date),
          type: data.type,
          duration: data.duration,
          caloriesBurned: data.caloriesBurned,
        }))
      }

      if (type === "sleep" || type === "general") {
        const healthData = await db
          .collection("healthData")
          .find({ userId: user._id })
          .sort({ date: -1 })
          .limit(10)
          .toArray()
        
        userData.healthData = healthData.map((data) => ({
          date: new Date(data.date),
          weight: data.weight,
          height: data.height,
          bloodPressure: data.bloodPressure,
          heartRate: data.heartRate,
          sleepHours: data.sleepHours,
        }))
      }

      // 记录请求
      console.log(`[AI Recommendations] User: ${user.email}, Type: ${type}`)
      
      const recommendations = await AIService.generateHealthRecommendations(userData, type)
      return NextResponse.json({ recommendations })
    }
  } catch (error) {
    // 记录错误
    console.error("[AI API Error]", {
      error,
      timestamp: new Date().toISOString(),
      path: req.url,
    })

    // 返回适当的错误响应
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

