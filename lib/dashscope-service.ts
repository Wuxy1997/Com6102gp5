export class DashScopeService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected response format from API');
      }
    } catch (error) {
      console.error('Error calling DashScope API:', error);
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
    const systemPrompt = `You are a health advisor. Generate recommendations in JSON format.

    RESPONSE FORMAT:
    {
      "exercise": [
        "Start with 20 minutes of brisk walking 3 times per week",
        "Do 10-15 minutes of basic stretching before exercise",
        "Practice bodyweight exercises like push-ups and squats",
        "Try swimming or cycling for low-impact cardio",
        "Include 5-minute warm-up and cool-down periods"
      ],
      "diet": [
        "Eat protein-rich foods with each meal",
        "Include 2-3 servings of vegetables daily",
        "Drink water before and after meals",
        "Choose whole grains over refined grains",
        "Plan regular meal times and avoid late eating"
      ],
      "health": [
        "Maintain a consistent sleep schedule",
        "Take 5-minute breaks every hour when working",
        "Practice deep breathing exercises daily",
        "Schedule regular health check-ups",
        "Keep a daily health journal"
      ]
    }

    REQUIREMENTS:
    1. Return ONLY the JSON object
    2. Each array must contain exactly 5 items
    3. Each recommendation must be clear and actionable
    4. Use proper sentence structure and punctuation
    5. Keep recommendations concise but specific`;

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