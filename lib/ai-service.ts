import { generateText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

// AI服务类，处理所有AI相关功能
export class AIService {
  // 生成聊天回复
  static async generateChatResponse(message: string): Promise<string> {
    try {
      const systemPrompt = `你是一个健康和健身AI助手。
      你的名字是HealthBot，你的目标是帮助用户解答他们的健康和健身问题。
      提供准确、有帮助的健康、营养、运动和健康信息。
      保持支持和鼓励的态度。如果你不知道某些信息，请直接说明而不是提供不准确的信息。
      专注于基于证据的建议，避免推广极端或潜在有害的做法。`

      const { text } = await generateText({
        model: deepseek("deepseek-coder"),
        prompt: `${systemPrompt}\n\n用户问题: ${message}\n\n你的回答:`,
        apiKey: process.env.DEEPSEEK_API_KEY || "",
      })

      return text
    } catch (error) {
      console.error("Error generating chat response:", error)
      throw new Error("Failed to generate AI response")
    }
  }

  // 生成健康建议
  static async generateHealthRecommendations(
    userData: {
      healthData?: any[]
      exerciseData?: any[]
      foodData?: any[]
    },
    type: "diet" | "exercise" | "sleep" | "general" = "general",
  ): Promise<string> {
    try {
      let systemPrompt = `你是一个健康和健身AI助手。你可以访问以下用户数据：\n\n`
      let userPrompt = ""

      // 根据类型构建提示词
      if (type === "diet" && userData.foodData) {
        systemPrompt += `饮食记录: ${JSON.stringify(userData.foodData)}\n\n`
        systemPrompt += `基于这些数据，提供个性化的饮食和营养建议。`
        userPrompt = "根据我的饮食记录，您有什么营养和饮食建议？"
      } else if (type === "exercise" && userData.exerciseData) {
        systemPrompt += `运动记录: ${JSON.stringify(userData.exerciseData)}\n\n`
        systemPrompt += `基于这些数据，提供个性化的运动和健身建议。`
        userPrompt = "根据我的运动记录，您有什么锻炼和健身建议？"
      } else if (type === "sleep" && userData.healthData) {
        systemPrompt += `健康数据: ${JSON.stringify(userData.healthData)}\n\n`
        systemPrompt += `基于这些数据，特别关注睡眠时间，提供个性化的睡眠改善建议。`
        userPrompt = "根据我的睡眠记录，您有什么改善睡眠质量的建议？"
      } else {
        // 通用建议
        if (userData.healthData) {
          systemPrompt += `健康数据: ${JSON.stringify(userData.healthData)}\n`
        }
        if (userData.exerciseData) {
          systemPrompt += `运动记录: ${JSON.stringify(userData.exerciseData)}\n`
        }
        if (userData.foodData) {
          systemPrompt += `饮食记录: ${JSON.stringify(userData.foodData)}\n`
        }
        systemPrompt += `\n基于这些数据，提供全面的健康和健身建议。`
        userPrompt = "根据我的健康数据，您有什么综合性的健康建议？"
      }

      const { text } = await generateText({
        model: deepseek("deepseek-coder"),
        prompt: `${systemPrompt}\n\n问题: ${userPrompt}\n\n你的回答:`,
        apiKey: process.env.DEEPSEEK_API_KEY || "",
      })

      return text
    } catch (error) {
      console.error("Error generating recommendations:", error)
      throw new Error("Failed to generate health recommendations")
    }
  }
}

