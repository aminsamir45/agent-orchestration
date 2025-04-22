import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini API with API key from environment
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Service for executing generated agent systems
 */
export class ExecutionService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  /**
   * Execute an agent design with user query
   * @param design - The complete agent design
   * @param query - User query to process
   * @returns Execution results
   */
  async executeAgentSystem(design: any, query: string) {
    try {
      // For now, we'll simulate execution using Gemini directly
      // In a real implementation, this would dynamically construct and execute an agent system
      
      const prompt = `
      You are simulating an agent orchestration system with the following design:
      ${JSON.stringify(design, null, 2)}
      
      Please process this user query as if you were this system:
      "${query}"
      
      Return a JSON response with:
      1. "processSteps": Array of steps showing how different agents in the system processed the query
      2. "finalResponse": The final response to the user
      3. "metrics": Execution metrics like time taken by each agent
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse the JSON from the response
      const jsonStr = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*\}/);
                      
      if (!jsonStr) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const cleanedJson = jsonStr[0].replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error executing agent system:', error);
      throw error;
    }
  }
  
  /**
   * Generate executable code for a design
   * @param design - The complete agent design
   * @returns Code to implement the agent system
   */
  async generateExecutableCode(design: any) {
    try {
      const prompt = `
      You are an expert AI engineer. Based on this agent design:
      ${JSON.stringify(design, null, 2)}
      
      Generate executable JavaScript/TypeScript code that implements this agent system using LangChain and LangGraph.
      Focus on creating a working implementation that could be run locally.
      
      Response format:
      {
        "implementation": "Your complete code here as a string",
        "setupInstructions": "Instructions for setting up and running the code",
        "exampleUsage": "Example of how to use the implemented system"
      }
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parse the JSON from the response
      const jsonStr = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*\}/);
                      
      if (!jsonStr) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const cleanedJson = jsonStr[0].replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error generating executable code:', error);
      throw error;
    }
  }
} 