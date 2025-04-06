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
  ): Promise<string> {
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
    Please analyze the user's data and provide specific, actionable recommendations that are:
    1. Evidence-based and safe
    2. Personalized to their data
    3. Clear and easy to understand
    4. Focused on gradual, sustainable improvements
    5. Considerate of their current habits and lifestyle
    
    Format your response in a clear, structured way with specific recommendations.`;

    return this.generateText(`${systemPrompt}\n\n${prompt}`);
  }
} 