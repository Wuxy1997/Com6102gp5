import { DashScopeService } from './dashscope-service';

const dashScopeService = new DashScopeService(
  process.env.DASHSCOPE_API_KEY || '',
  'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'deepseek-r1'
);

// AI服务类，处理所有AI相关功能
export class AIService {
  // 生成聊天回复
  static async generateChatResponse(userInput: string): Promise<string> {
    try {
      const systemPrompt = `You are a professional health advisor with expertise in fitness, nutrition, and general wellness. 
      Please provide helpful, evidence-based advice in a friendly and professional manner. 
      Focus on practical, actionable recommendations that are safe and sustainable.`;
      
      return await dashScopeService.generateText(`${systemPrompt}\n\nUser: ${userInput}`);
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // 生成健康建议
  static async generateHealthRecommendations(
    userData: {
      healthData?: any[];
      exerciseData?: any[];
      foodData?: any[];
    },
    type: "diet" | "exercise" | "sleep" | "general" = "general"
  ): Promise<any> {
    try {
      return await dashScopeService.generateHealthRecommendations(userData, type);
    } catch (error) {
      console.error('Error generating health recommendations:', error);
      throw new Error('Failed to generate health recommendations');
    }
  }
}

