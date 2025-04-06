import { BailianService } from './bailian-service';

const bailianService = new BailianService(process.env.BAILIAN_API_KEY || '');

// AI服务类，处理所有AI相关功能
export class AIService {
  // 生成聊天回复
  static async generateChatResponse(userInput: string): Promise<string> {
    try {
      return await bailianService.generateText(userInput);
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error('Failed to generate AI response');
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
      return await bailianService.generateHealthRecommendations(userData, type);
    } catch (error) {
      console.error('Error generating health recommendations:', error);
      throw new Error('Failed to generate health recommendations');
    }
  }
}

