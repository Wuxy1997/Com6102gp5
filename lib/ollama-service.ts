/// <reference types="node" />

export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.OLLAMA_HOST || "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama2-7b-chat",
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.8,
            num_ctx: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama API:', error);
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
  ): Promise<{ exercise: string[]; diet: string[]; health: string[]; }> {
    let prompt = "";

    // Build prompt based on type
    if (type === "diet" && userData.foodData) {
      prompt = `As a health advisor, please provide personalized nutrition recommendations based on the following user's food records:\n${JSON.stringify(userData.foodData, null, 2)}`;
    } else if (type === "exercise" && userData.exerciseData) {
      prompt = `As a health advisor, please provide personalized fitness recommendations based on the following user's exercise records:\n${JSON.stringify(userData.exerciseData, null, 2)}`;
    } else if (type === "sleep" && userData.healthData) {
      prompt = `As a health advisor, please provide sleep improvement recommendations based on the following user's health data:\n${JSON.stringify(userData.healthData, null, 2)}`;
    } else {
      prompt = `As a health advisor, please provide comprehensive health recommendations based on the following user's data:\n`;
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

    // Add system context
    const systemPrompt = `You are a professional health advisor with expertise in fitness, nutrition, and general wellness. 
    Please analyze the user's data and provide specific, actionable recommendations in three categories:
    1. Exercise recommendations (5 items)
    2. Diet recommendations (5 items)
    3. General health recommendations (5 items)

    Each recommendation should be:
    - Evidence-based and safe
    - Personalized to their data
    - Clear and easy to understand
    - Focused on gradual, sustainable improvements
    - Considerate of their current habits and lifestyle

    Format your response as a JSON object with exactly this structure:
    {
      "exercise": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
      "diet": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
      "health": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
    }`;

    const aiResponse = await this.generateText(`${systemPrompt}\n\n${prompt}`);
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        exercise: Array.isArray(parsedResponse.exercise) ? parsedResponse.exercise : [],
        diet: Array.isArray(parsedResponse.diet) ? parsedResponse.diet : [],
        health: Array.isArray(parsedResponse.health) ? parsedResponse.health : []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return default recommendations if parsing fails
      return {
        exercise: [
          "Incorporate 30 minutes of moderate cardio 3-4 times per week",
          "Add strength training 2-3 times per week focusing on major muscle groups",
          "Consider yoga or stretching to improve flexibility and reduce stress",
          "Try interval training to boost metabolism and cardiovascular health",
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
  }
} 