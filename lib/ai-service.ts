import { BailianService } from './bailian-service';

const bailianService = new BailianService(process.env.BAILIAN_API_KEY || '');

// AI service class to handle all AI-related functionality
export class AIService {
  // Generate chat response
  static async generateChatResponse(userInput: string): Promise<string> {
    try {
      const systemPrompt = `You are a professional health advisor with expertise in fitness, nutrition, and general wellness.
      Please provide helpful, evidence-based advice in a friendly and professional manner.
      Focus on practical, actionable recommendations that are safe and sustainable.`;
      
      return await bailianService.generateText(`${systemPrompt}\n\nUser: ${userInput}`);
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Generate health recommendations
  static async generateHealthRecommendations(
    userData: {
      healthData?: any[];
      exerciseData?: any[];
      foodData?: any[];
    },
    type: "diet" | "exercise" | "sleep" | "general" = "general"
  ): Promise<{ exercise: string[]; diet: string[]; health: string[]; }> {
    try {
      const response = await bailianService.generateHealthRecommendations(userData, type);
      
      // Parse AI response in JSON format
      try {
        // 清理响应中的 Markdown 标记
        const cleanedResponse = response
          .replace(/```json\n?/g, '')  // 移除开头的 ```json
          .replace(/```\n?/g, '')      // 移除结尾的 ```
          .trim();                     // 移除首尾空白

        const parsedResponse = JSON.parse(cleanedResponse);
        
        // Ensure each category has exactly 5 recommendations
        const ensureFiveRecommendations = (arr: string[] | undefined) => {
          if (!arr || !Array.isArray(arr)) return [];
          return arr.slice(0, 5).concat(
            Array(5 - arr.length).fill("No specific recommendation available")
          );
        };

        return {
          exercise: ensureFiveRecommendations(parsedResponse.exercise),
          diet: ensureFiveRecommendations(parsedResponse.diet),
          health: ensureFiveRecommendations(parsedResponse.health)
        };
      } catch (error) {
        console.error('Error parsing AI response:', error);
        // Return default recommendations if parsing fails
        return {
          exercise: [
            "Incorporate 30 minutes of moderate cardio 3-4 times per week",
            "Add strength training 2-3 times per week focusing on major muscle groups",
            "Try yoga or stretching to improve flexibility and reduce stress",
            "Consider interval training to boost metabolism and cardiovascular health",
            "Ensure proper warm-up and cool-down for each workout session"
          ],
          diet: [
            "Increase protein intake to support muscle recovery",
            "Add more leafy greens and colorful vegetables to your meals",
            "Consider reducing processed food consumption",
            "Stay hydrated by drinking at least 8 glasses of water daily",
            "Balance your macronutrients for optimal energy throughout the day"
          ],
          health: [
            "Prioritize 7-8 hours of quality sleep each night",
            "Practice stress management techniques like meditation",
            "Consider regular health check-ups to monitor progress",
            "Take short breaks during long periods of sitting",
            "Maintain social connections to support mental wellbeing"
          ]
        };
      }
    } catch (error) {
      console.error('Error generating health recommendations:', error);
      throw new Error('Failed to generate health recommendations');
    }
  }
}

// Export the static methods
export const generateHealthRecommendations = AIService.generateHealthRecommendations;
export const generateChatResponse = AIService.generateChatResponse;

