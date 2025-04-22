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
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 8000
};

/**
 * Service class for interacting with Gemini API
 */
export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  /**
   * Executes a function with exponential backoff retry logic
   * @param fn - The async function to execute
   * @returns The result of the function
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let retries = 0;
    let delay = RETRY_CONFIG.initialDelay;
    
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        retries++;
        
        if (retries > RETRY_CONFIG.maxRetries || 
            !(error.message.includes('rate limit') || error.message.includes('timeout'))) {
          throw error;
        }
        
        console.warn(`Retry ${retries}/${RETRY_CONFIG.maxRetries} after error: ${error.message}`);
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, RETRY_CONFIG.maxDelay);
      }
    }
  }

  /**
   * Calculate confidence scores based on clarity, specificity, and completeness
   * @param components - The extracted components
   * @param systemDescription - The original system description
   * @returns The input components with confidence scores added
   */
  private calculateConfidenceScores(components: any, systemDescription: string): any {
    // Define baseline confidence
    const baseline = 70;
    
    // Add confidence scores to each component type
    const result = { ...components };
    
    // Calculate agent confidence based on detail level and mentions
    if (result.agents) {
      result.agents = result.agents.map((agent: any) => {
        // Higher confidence if agent has detailed description
        const detailScore = agent.description ? 
          Math.min(15, agent.description.length / 20) : 0;
          
        // Higher confidence if agent is mentioned multiple times
        const mentionCount = (systemDescription.match(
          new RegExp(agent.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi')
        ) || []).length;
        const mentionScore = Math.min(10, mentionCount * 2);
        
        // Higher confidence if agent has clear responsibilities
        const roleScore = agent.role && agent.role.length > 10 ? 10 : 0;
        
        const confidence = Math.min(100, Math.round(baseline + detailScore + mentionScore + roleScore));
        
        return {
          ...agent,
          confidence
        };
      });
    }
    
    // Calculate tool confidence
    if (result.tools) {
      result.tools = result.tools.map((tool: any) => {
        // Higher confidence for specific tool names
        const specificityScore = tool.name.length > 3 ? 10 : 0;
        
        // Higher confidence if tool purpose is clear
        const purposeScore = tool.purpose && tool.purpose.length > 15 ? 15 : 0;
        
        // Check if the tool is explicitly mentioned
        const isExplicit = systemDescription.toLowerCase().includes(tool.name.toLowerCase());
        const explicitScore = isExplicit ? 15 : 0;
        
        const confidence = Math.min(100, Math.round(baseline + specificityScore + purposeScore + explicitScore));
        
        return {
          ...tool,
          confidence
        };
      });
    }
    
    // Calculate relationship confidence
    if (result.relationships) {
      result.relationships = result.relationships.map((rel: any) => {
        // Higher confidence for well-defined relationships
        const clarityScore = rel.description && rel.description.length > 20 ? 15 : 0;
        
        // Higher confidence for explicitly stated connections
        const sourceTargetScore = rel.source && rel.target ? 15 : 0;
        
        // Higher confidence for specified data flow
        const dataFlowScore = rel.dataFlow ? 10 : 0;
        
        const confidence = Math.min(100, Math.round(baseline + clarityScore + sourceTargetScore + dataFlowScore));
        
        return {
          ...rel,
          confidence
        };
      });
    }
    
    // Calculate overall system confidence
    result.systemConfidence = {
      overall: Math.min(95, this.calculateOverallConfidence(result, systemDescription)),
      completeness: this.assessCompleteness(result),
      consistency: this.assessConsistency(result),
      clarity: this.assessClarity(systemDescription)
    };
    
    return result;
  }
  
  /**
   * Calculate an overall confidence score for the system
   * @param components - The extracted components with confidence scores
   * @param systemDescription - The original system description
   * @returns A number between 0-100 representing overall confidence
   */
  private calculateOverallConfidence(components: any, systemDescription: string): number {
    // Start with baseline
    let score = 65;
    
    // Higher score for more complete descriptions
    score += Math.min(10, systemDescription.length / 200);
    
    // Higher score for more consistent agent structure
    if (components.agents && components.agents.length > 0) {
      const agentScores = components.agents.map((a: any) => a.confidence || 0);
      score += Math.min(10, agentScores.reduce((a: number, b: number) => a + b, 0) / agentScores.length / 10);
    } else {
      score -= 15; // Penalize for missing agents
    }
    
    // Higher score for defined tools
    if (components.tools && components.tools.length > 0) {
      score += 5;
    }
    
    // Higher score for defined relationships
    if (components.relationships && components.relationships.length > 0) {
      score += 10;
    }
    
    return Math.round(score);
  }
  
  /**
   * Assess the completeness of the extracted components
   * @param components - The extracted components
   * @returns A number between 0-100 representing completeness
   */
  private assessCompleteness(components: any): number {
    let score = 50;
    
    // Check if all essential components are present
    if (components.agents && components.agents.length > 0) score += 15;
    if (components.tools && components.tools.length > 0) score += 10;
    if (components.relationships && components.relationships.length > 0) score += 15;
    if (components.orchestrationPattern) score += 10;
    
    return Math.round(score);
  }
  
  /**
   * Assess the consistency of the extracted components
   * @param components - The extracted components
   * @returns A number between 0-100 representing consistency
   */
  private assessConsistency(components: any): number {
    let score = 70;
    
    // Check if relationships reference existing agents
    if (components.relationships && components.agents) {
      const agentNames = new Set(components.agents.map((a: any) => a.name));
      let validRelations = 0;
      let totalRelations = 0;
      
      components.relationships.forEach((rel: any) => {
        totalRelations++;
        if (agentNames.has(rel.source) && agentNames.has(rel.target)) {
          validRelations++;
        }
      });
      
      if (totalRelations > 0) {
        score += Math.round(20 * (validRelations / totalRelations));
      }
    }
    
    return Math.round(score);
  }
  
  /**
   * Assess the clarity of the system description
   * @param systemDescription - The original system description
   * @returns A number between 0-100 representing clarity
   */
  private assessClarity(systemDescription: string): number {
    let score = 60;
    
    // More structured text tends to be clearer
    const hasSections = /#+\s+\w+/gm.test(systemDescription);
    if (hasSections) score += 15;
    
    // Longer descriptions tend to be more detailed
    score += Math.min(10, systemDescription.length / 300);
    
    // Presence of examples suggests clarity
    if (systemDescription.includes('example') || systemDescription.includes('for instance')) {
      score += 10;
    }
    
    return Math.round(score);
  }

  /**
   * Process the initial system description to extract key components and requirements
   * @param systemDescription - User's description of the agent system
   * @returns Processed analysis with extracted components and confidence levels
   */
  async processInitialDescription(systemDescription: string) {
    try {
      const startTime = Date.now();
      
      // Enhanced prompt with more detailed guidance for the model
      const prompt = `
      You are an expert AI system designer specialized in multi-agent orchestration.
      
      TASK:
      Analyze this system description and extract key components with high accuracy.
      
      SYSTEM DESCRIPTION:
      ${systemDescription}
      
      INSTRUCTIONS:
      1. Carefully identify all agents and their specific roles, responsibilities, and capabilities.
      2. Determine the tools/APIs each agent requires to fulfill its responsibilities.
      3. Map the relationships and data flows between agents.
      4. Recommend an orchestration pattern that best suits this system.
      5. Specify any constraints or requirements mentioned.
      
      EXAMPLES OF AGENT TYPES:
      - Coordinator/Orchestrator: Manages workflow between other agents
      - Information Retrieval: Gathers data from sources
      - Processing/Analysis: Transforms or analyzes data
      - Decision Making: Makes choices based on criteria
      - User Interface: Interacts with users
      - Domain Specialist: Has expertise in specific areas
      
      EXAMPLES OF ORCHESTRATION PATTERNS:
      - Sequential: Agents work in a predefined order (like an assembly line)
      - Hierarchical: Main coordinator delegates to sub-agents
      - Peer-based: Agents communicate directly with each other
      - Hybrid: Combination of multiple patterns
      
      RESPONSE FORMAT:
      Provide a detailed JSON with the following structure:
      {
        "summary": "Brief overview of the system's purpose and function",
        "agents": [
          {
            "name": "Agent name",
            "role": "Primary function",
            "description": "Detailed description of responsibilities",
            "required_capabilities": ["capability1", "capability2"]
          }
        ],
        "tools": [
          {
            "name": "Tool name",
            "purpose": "What this tool does",
            "usedBy": ["Agent1", "Agent2"]
          }
        ],
        "relationships": [
          {
            "source": "Agent1",
            "target": "Agent2",
            "description": "How they interact",
            "dataFlow": "What information passes between them"
          }
        ],
        "orchestrationPattern": {
          "type": "Sequential|Hierarchical|Peer-based|Hybrid",
          "justification": "Why this pattern is appropriate"
        },
        "constraints": ["Any system limitations or requirements"],
        "potentialChallenges": ["Potential implementation challenges"]
      }
      
      Make sure your response ONLY contains the JSON without any additional text, comments, or markdown formatting.
      `;

      const result = await this.withRetry(async () => {
        const generationResult = await this.model.generateContent(prompt);
        return generationResult.response;
      });
      
      const text = result.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       text.match(/\{[\s\S]*\}/);
                      
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const cleanedJson = jsonMatch[0].replace(/```json\s*|\s*```/g, '');
      let parsedResult = JSON.parse(cleanedJson);
      
      // Apply confidence scoring to the components
      parsedResult = this.calculateConfidenceScores(parsedResult, systemDescription);
      
      // Add metadata to the response
      parsedResult.metadata = {
        processingTime: Date.now() - startTime,
        modelVersion: 'gemini-pro',
        promptVersion: '1.2',
        timestamp: new Date().toISOString()
      };
      
      return parsedResult;
    } catch (error) {
      console.error('Error processing initial description:', error);
      throw error;
    }
  }

  /**
   * Process the second pass with tool selections to refine the agent design
   * @param initialAnalysis - The results from the first analysis
   * @param toolSelections - Tools selected by the user
   * @returns Refined agent design
   */
  async processToolSelections(initialAnalysis: any, toolSelections: string[]) {
    try {
      const prompt = `
      You are an expert AI system designer specializing in agent orchestration.
      
      Initial analysis: ${JSON.stringify(initialAnalysis)}
      
      The user has selected these specific tools: ${JSON.stringify(toolSelections)}
      
      Based on this selection, provide a refined agent orchestration design as JSON with:
      1. "agents": Array of agent definitions with roles and responsibilities
      2. "relationships": How agents interact with each other
      3. "dataFlow": How information flows through the system
      4. "toolIntegration": How the selected tools are integrated
      5. "executionFlow": Step-by-step execution process
      `;

      const result = await this.withRetry(async () => {
        const generationResult = await this.model.generateContent(prompt);
        return generationResult.response;
      });
      
      const text = result.text();
      
      // Parse the JSON from the response
      const jsonStr = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*\}/);
                      
      if (!jsonStr) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const cleanedJson = jsonStr[0].replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error processing tool selections:', error);
      throw error;
    }
  }

  /**
   * Generate a diagram based on the refined agent design
   * @param refinedDesign - The refined agent design
   * @returns Mermaid diagram code and system implementation details
   */
  async generateDiagram(refinedDesign: any) {
    try {
      const prompt = `
      You are an expert system architect who excels at creating clear diagrams.
      
      Based on this refined agent design: ${JSON.stringify(refinedDesign)}
      
      Create a comprehensive Mermaid.js diagram showing the agent orchestration.
      The diagram should clearly show:
      1. All agents as nodes
      2. Relationships and interactions between agents
      3. Data flow directions
      4. Tool integration points
      5. Decision points or conditional logic
      
      Also provide implementation recommendations as a JSON object.
      
      Response format:
      {
        "mermaidDiagram": "your mermaid.js code here",
        "implementationDetails": {
          "recommendedFrameworks": [],
          "keyComponents": [],
          "implementationSteps": []
        }
      }
      `;

      const result = await this.withRetry(async () => {
        const generationResult = await this.model.generateContent(prompt);
        return generationResult.response;
      });
      
      const text = result.text();
      
      // Parse the JSON from the response
      const jsonStr = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/\{[\s\S]*\}/);
                      
      if (!jsonStr) {
        throw new Error('Failed to extract JSON from Gemini response');
      }
      
      const cleanedJson = jsonStr[0].replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error generating diagram:', error);
      throw error;
    }
  }
} 