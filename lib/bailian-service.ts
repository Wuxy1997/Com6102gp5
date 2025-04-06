export class BailianService {
  private apiKey: string;
  private baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const requestBody = JSON.stringify({
        model: "deepseek-r1-distil-qwen-7b",
        input: {
          messages: [
            {
              role: "system",
              content: "你是一个专业的健康顾问，可以为用户提供健康、营养和运动方面的建议。请保持专业、友好的态度。"
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }
      });

      console.log('Making API request with key:', this.apiKey);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'false'
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.output && data.output.text) {
        return data.output.text;
      } else if (data.message && data.message.content) {
        return data.message.content;
      } else {
        console.error('Unexpected API response format:', data);
        throw new Error('Unexpected API response format');
      }
    } catch (error) {
      console.error('Error calling Bailian API:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateHealthRecommendations(
    userData: {
      healthData?: any[];
      exerciseData?: any[];
      foodData?: any[];
    },
    type: "diet" | "exercise" | "sleep" | "general" = "general"
  ): Promise<string> {
    let prompt = "";

    // 根据类型构建提示词
    if (type === "diet" && userData.foodData) {
      prompt = `作为健康顾问，请根据以下用户的饮食记录提供个性化的营养建议：\n${JSON.stringify(userData.foodData, null, 2)}`;
    } else if (type === "exercise" && userData.exerciseData) {
      prompt = `作为健康顾问，请根据以下用户的运动记录提供个性化的健身建议：\n${JSON.stringify(userData.exerciseData, null, 2)}`;
    } else if (type === "sleep" && userData.healthData) {
      prompt = `作为健康顾问，请根据以下用户的健康数据提供改善睡眠的建议：\n${JSON.stringify(userData.healthData, null, 2)}`;
    } else {
      prompt = `作为健康顾问，请根据以下用户的综合数据提供全面的健康建议：\n`;
      if (userData.healthData) {
        prompt += `\n健康数据：${JSON.stringify(userData.healthData, null, 2)}`;
      }
      if (userData.exerciseData) {
        prompt += `\n运动记录：${JSON.stringify(userData.exerciseData, null, 2)}`;
      }
      if (userData.foodData) {
        prompt += `\n饮食记录：${JSON.stringify(userData.foodData, null, 2)}`;
      }
    }

    return this.generateText(prompt);
  }
} 