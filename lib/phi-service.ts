import { spawn } from 'child_process';
import path from 'path';

export class PhiService {
  private pythonProcess: any;
  private modelReady: boolean = false;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 启动 Python 进程
      const pythonScript = path.join(process.cwd(), 'python', 'phi_model.py');
      this.pythonProcess = spawn('python', [pythonScript]);

      this.pythonProcess.stdout.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        if (message === 'MODEL_READY') {
          this.modelReady = true;
          resolve();
        }
        console.log('Python output:', message);
      });

      this.pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error('Python error:', data.toString());
      });

      this.pythonProcess.on('error', (error: Error) => {
        console.error('Failed to start Python process:', error);
        reject(error);
      });

      this.pythonProcess.on('exit', (code: number) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          this.modelReady = false;
        }
      });
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      // 等待模型初始化完成
      await this.initPromise;

      if (!this.modelReady) {
        throw new Error('Model is not ready');
      }

      return new Promise((resolve, reject) => {
        // 发送提示词到 Python 进程
        this.pythonProcess.stdin.write(JSON.stringify({ prompt }) + '\n');

        const timeout = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 30000); // 30秒超时

        const responseHandler = (data: Buffer) => {
          try {
            const response = JSON.parse(data.toString().trim());
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.text);
            }
            clearTimeout(timeout);
            this.pythonProcess.stdout.removeListener('data', responseHandler);
          } catch (error) {
            console.error('Error parsing response:', error);
          }
        };

        this.pythonProcess.stdout.on('data', responseHandler);
      });
    } catch (error) {
      console.error('Error generating text:', error);
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
    let prompt = "You are a professional fitness trainer and nutritionist. ";

    if (type === "diet" && userData.foodData) {
      prompt += `Based on the user's diet records, provide personalized nutrition advice:\n${JSON.stringify(userData.foodData, null, 2)}`;
    } else if (type === "exercise" && userData.exerciseData) {
      prompt += `Based on the user's exercise records, provide personalized fitness advice:\n${JSON.stringify(userData.exerciseData, null, 2)}`;
    } else if (type === "sleep" && userData.healthData) {
      prompt += `Based on the user's health data, provide sleep improvement advice:\n${JSON.stringify(userData.healthData, null, 2)}`;
    } else {
      prompt += `Based on the following comprehensive data, provide overall health advice:\n`;
      if (userData.healthData) {
        prompt += `\nHealth data: ${JSON.stringify(userData.healthData, null, 2)}`;
      }
      if (userData.exerciseData) {
        prompt += `\nExercise records: ${JSON.stringify(userData.exerciseData, null, 2)}`;
      }
      if (userData.foodData) {
        prompt += `\nDiet records: ${JSON.stringify(userData.foodData, null, 2)}`;
      }
    }

    return this.generateText(prompt);
  }

  async cleanup() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
    }
  }
} 