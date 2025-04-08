import OpenAI from 'openai';

export class BailianService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "deepseek-r1",
        messages: [
          { role: "user", content: prompt }
        ],
      });

      return completion.choices[0].message.content || '';
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

    // Build prompt based on type
    if (type === "diet" && userData.foodData) {
      prompt = `As a health advisor, please provide personalized nutrition recommendations based on the following user's food records. Return the response in JSON format with three arrays: exercise, diet, and health, each containing 5 recommendations:\n${JSON.stringify(userData.foodData, null, 2)}`;
    } else if (type === "exercise" && userData.exerciseData) {
      prompt = `As a health advisor, please provide personalized fitness recommendations based on the following user's exercise records. Return the response in JSON format with three arrays: exercise, diet, and health, each containing 5 recommendations:\n${JSON.stringify(userData.exerciseData, null, 2)}`;
    } else if (type === "sleep" && userData.healthData) {
      prompt = `As a health advisor, please provide sleep improvement recommendations based on the following user's health data. Return the response in JSON format with three arrays: exercise, diet, and health, each containing 5 recommendations:\n${JSON.stringify(userData.healthData, null, 2)}`;
    } else {
      prompt = `As a health advisor, please provide comprehensive health recommendations based on the following user's data. Return the response in JSON format with three arrays: exercise, diet, and health, each containing 5 recommendations:\n`;
      if (userData.healthData) {
        prompt += `\nHealth Data: ${JSON.stringify(userData.healthData, null, 2)}`;
      }
      if (userData.exerciseData) {
        prompt += `\nExercise Records: ${JSON.stringify(userData.exerciseData, null, 2)}`;
      }
      if (userData.foodData) {
        prompt += `\nFood Records: ${JSON.stringify(userData.foodData, null, 2)}`;
      }
    }

    return this.generateText(prompt);
  }
} 