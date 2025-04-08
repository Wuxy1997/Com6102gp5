import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { AIService } from "@/lib/ai-service"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { z } from "zod"
import { generateHealthRecommendations } from "@/lib/ai-service"
import { generateHealthRecommendations as generateBailianRecommendations } from "@/lib/bailian-service"
import { BailianService } from "@/lib/bailian-service"

interface FoodRecord {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: string
}

interface ExerciseRecord {
  type: string
  duration: number
  calories: number
  timestamp: string
}

interface HealthData {
  sleep: number
  stress: number
  mood: number
  timestamp: string
}

// 定义数据模型
const FoodRecordSchema = z.object({
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  timestamp: z.string(),
})

const ExerciseRecordSchema = z.object({
  type: z.string(),
  duration: z.number(),
  calories: z.number(),
  timestamp: z.string(),
})

const HealthDataSchema = z.object({
  sleep: z.number(),
  stress: z.number(),
  mood: z.number(),
  timestamp: z.string(),
})

// 定义请求验证模式
const requestSchema = z.object({
  type: z.enum(["diet", "exercise", "sleep", "general"]).optional(),
  data: z.object({
    food: z.array(FoodRecordSchema).optional(),
    exercise: z.array(ExerciseRecordSchema).optional(),
    health: z.array(HealthDataSchema).optional(),
  }),
})

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
    const body = await req.json()
    const validatedData = requestSchema.parse(body)

    // Get user's data from database
    const foodData = await db
      .collection("food_records")
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    const exerciseData = await db
      .collection("exercise_records")
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    const healthData = await db
      .collection("health_data")
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    // Generate recommendations based on service type
    let recommendations
    const aiService = new AIService()
    const bailianService = new BailianService(process.env.BAILIAN_API_KEY || '')

    if (validatedData.type === "diet") {
      recommendations = await AIService.generateHealthRecommendations(
        { foodData: validatedData.data.food || foodData },
        "diet"
      )
    } else if (validatedData.type === "exercise") {
      recommendations = await bailianService.generateHealthRecommendations(
        { exerciseData: validatedData.data.exercise || exerciseData },
        "exercise"
      )
    } else if (validatedData.type === "sleep") {
      recommendations = await bailianService.generateHealthRecommendations(
        { healthData: validatedData.data.health || healthData },
        "sleep"
      )
    } else {
      recommendations = await AIService.generateHealthRecommendations({
        foodData: validatedData.data.food || foodData,
        exerciseData: validatedData.data.exercise || exerciseData,
        healthData: validatedData.data.health || healthData,
      })
    }

    return NextResponse.json({ recommendations })
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
        { error: "Invalid request data", details: error.format() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}

