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
          model: "tinyllama",
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
      // Handle both possible response formats
      if (typeof data.response === 'string') {
        return data.response;
      } else if (typeof data === 'string') {
        return data;
      } else {
        throw new Error('Unexpected response format from Ollama API');
      }
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

    // Simplified system prompt
    const systemPrompt = `You are a professional health advisor. Please provide specific, actionable recommendations in three categories:
    1. Exercise recommendations (5 items)
    2. Diet recommendations (5 items)
    3. General health recommendations (5 items)

    Format your response as a JSON object with this exact structure:
    {
      "exercise": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
      "diet": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
      "health": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
    }

    Make sure to:
    - Use the exact field names: "exercise", "diet", "health"
    - Return a single JSON object, not an array
    - Provide exactly 5 recommendations in each category
    - Return ONLY the JSON object, without any markdown formatting or additional text
    - Do not include any prefixes like "Response:"
    - Do not include any explanatory text after the JSON object`;

    const aiResponse = await this.generateText(`${systemPrompt}\n\n${prompt}`);
    
    try {
      // Extract only the JSON part of the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      const jsonStr = jsonMatch[0];

      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(jsonStr);
      
      // Handle array response by taking the first non-empty object
      let recommendations;
      if (Array.isArray(parsedResponse)) {
        recommendations = parsedResponse.find(obj => 
          obj.exercise?.length > 0 || 
          (obj.diet || obj.dieet)?.length > 0 || 
          obj.health?.length > 0
        ) || parsedResponse[0];
      } else {
        recommendations = parsedResponse;
      }

      // Handle case-insensitive field names and typos
      const getField = (obj: any, possibleNames: string[]) => {
        for (const name of possibleNames) {
          const value = obj[name.toLowerCase()] || obj[name];
          if (value) return value;
        }
        return [];
      };

      return {
        exercise: Array.isArray(getField(recommendations, ['exercise', 'exeRCeise'])) ? 
                 getField(recommendations, ['exercise', 'exeRCeise']) : [],
        diet: Array.isArray(getField(recommendations, ['diet', 'dieet', 'dieT'])) ? 
              getField(recommendations, ['diet', 'dieet', 'dieT']) : [],
        health: Array.isArray(getField(recommendations, ['health'])) ? 
                getField(recommendations, ['health']) : []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw AI response:', aiResponse);
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