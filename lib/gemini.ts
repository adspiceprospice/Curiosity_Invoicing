import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);

// Create a Gemini model instance
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
});

export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: string | Part[];
}

export class GeminiAIService {
  private model: GenerativeModel;
  private chat: any; // Storing chat state

  constructor() {
    this.model = model;
    this.chat = model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
    });
  }

  /**
   * Send a message to Gemini and get a response
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const result = await this.chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error('Error communicating with Gemini API:', error);
      throw new Error('Failed to communicate with AI service');
    }
  }

  /**
   * Use function calling with Gemini
   */
  async callFunction(prompt: string, functions: any[]): Promise<any> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [
          {
            functionDeclarations: functions,
          },
        ],
      });

      const response = result.response;
      const functionCalls = response.functionCalls || [];
      
      return {
        text: response.text(),
        functionCalls,
      };
    } catch (error) {
      console.error('Error with Gemini function calling:', error);
      throw new Error('Failed to execute function call with AI service');
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiAIService();