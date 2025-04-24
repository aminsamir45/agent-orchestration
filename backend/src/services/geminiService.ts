import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Agent, AgentComponent, AgentDesign, DiagramData, FilteredMemory, InitialAnalysis, OrchestrationType, ToolSelections, DiagramNode, DiagramEdge } from '../types';

// Load environment variables
dotenv.config();

// Access API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
  private model: any;
  private genAI: any;
  private modelName: string;
  private apiKey: string;
  private retryCount: number = 3;
  
  constructor(apiKey: string = API_KEY) {
    this.apiKey = apiKey;
    this.modelName = 'gemini-2.0-flash';
    
    // Initialize the Google Generative AI client
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    
    console.log('GeminiService initialized with model:', this.modelName);
  }
  
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
      
      const text = result.response;
      
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
   * Process tool selections and refine the agent design
   * @param initialAnalysis - The initial analysis from processSystemDescription
   * @param toolSelections - Array of selected tools
   * @returns Refined agent design with confidence scores
   */
  async processToolSelections(initialAnalysis: any, toolSelections: string[]): Promise<any> {
    try {
      const { agents, relationships, workflow } = initialAnalysis;
      
      // Create prompt for refining design with tool selections
      const prompt = `
You are an expert system designer specializing in multi-agent AI systems.

I have an initial agent system design with the following components:

Agents: ${JSON.stringify(agents, null, 2)}

Relationships: ${JSON.stringify(relationships, null, 2)}

Workflow: ${JSON.stringify(workflow, null, 2)}

Now I need to integrate these specific tools into the design:
${toolSelections.join('\n')}

Please refine the design to optimally integrate these tools. For each agent, specify which tools they should use and why. Update the agent roles, capabilities, and relationships if needed.

Return your answer in this JSON format:
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "description": "string",
      "capabilities": ["string"],
      "tools": ["string"] // subset of the provided tools
    }
  ],
  "relationships": [
    {
      "from": "agent_id",
      "to": "agent_id",
      "type": "string", // e.g., "delegates_to", "reports_to", "collaborates_with"
      "description": "string"
    }
  ],
  "workflow": {
    "steps": [
      {
        "id": "string",
        "description": "string",
        "agents": ["agent_id"],
        "inputs": ["string"],
        "outputs": ["string"]
      }
    ],
    "triggers": ["string"]
  },
  "orchestrationPattern": {
    "name": "string", // e.g., "hierarchical", "peer-to-peer", "hub-and-spoke"
    "description": "string",
    "advantages": ["string"],
    "limitations": ["string"]
  }
}`;

      // Generate refinement with Gemini
      const geminiConfig = {
        temperature: 0.2,
        maxOutputTokens: 4096,
      };
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: geminiConfig,
      });
      
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response
      let jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                     text.match(/```\n([\s\S]*?)\n```/) ||
                     text.match(/\{[\s\S]*\}/);
                     
      let refinedDesign;
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
          refinedDesign = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          // Fallback to finding and parsing the full JSON object
          try {
            const fullJsonMatch = text.match(/\{[\s\S]*\}/);
            if (fullJsonMatch) {
              refinedDesign = JSON.parse(fullJsonMatch[0]);
            } else {
              throw new Error('Could not extract valid JSON from response');
            }
          } catch (err) {
            console.error('Failed to parse JSON with fallback:', err);
            throw new Error('Failed to extract valid JSON from response');
          }
        }
      } else {
        throw new Error('No JSON found in the response');
      }
      
      // Calculate confidence scores
      const confidenceScores = this.calculateToolSelectionConfidenceScores(refinedDesign, toolSelections);
      
      return {
        ...refinedDesign,
        confidenceScores
      };
    } catch (error: unknown) {
      console.error('Error processing tool selections:', error);
      throw new Error(`Failed to process tool selections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a diagram visualization for the agent system
   * @param refinedDesign - The refined agent design
   * @returns Mermaid.js diagram code
   */
  async generateDiagram(refinedDesign: any): Promise<string> {
    try {
      const { agents, relationships, orchestrationPattern } = refinedDesign;
      
      console.log('Starting Mermaid diagram generation');
      
      // Create prompt for generating diagram
      const prompt = `
Create a Mermaid.js diagram that visualizes this multi-agent system:

Agents: ${JSON.stringify(agents, null, 2)}

Relationships: ${JSON.stringify(relationships, null, 2)}

Orchestration Pattern: ${JSON.stringify(orchestrationPattern, null, 2)}

Use a flowchart or class diagram format. Make the diagram clear, readable, and visually represent the agents, their relationships, and the overall orchestration pattern. Include all agents, color-code by agent type or role, and clearly show the relationships between agents.

Return ONLY the Mermaid diagram code without any explanations. Do not include markdown code blocks. Start directly with "graph TD" or similar.
`;

      // Generate diagram with Gemini
      const geminiConfig = {
        temperature: 0.1,
        maxOutputTokens: 2048,
      };
      
      console.log('Sending Mermaid diagram generation request to Gemini API');
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: geminiConfig,
      });
      
      const response = result.response;
      const text = response.text();
      
      console.log('Received response for Mermaid diagram, first 100 chars:', text.substring(0, 100));
      
      // Extract Mermaid diagram code with multiple fallbacks
      let diagramCode = '';
      
      // Try markdown code block first
      const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)\n```/) || 
                          text.match(/```\n([\s\S]*?)\n```/);
      
      if (mermaidMatch) {
        console.log('Found Mermaid diagram in markdown code blocks');
        diagramCode = mermaidMatch[1].trim();
      } else {
        // Try to get raw diagram code without markdown formatting
        console.log('No markdown code blocks, looking for diagram syntax');
        const diagramMatch = text.match(/graph (TD|LR|RL|BT)[\s\S]*/);
        if (diagramMatch) {
          console.log('Found raw diagram syntax');
          diagramCode = diagramMatch[0].trim();
        } else {
          // Final fallback - just take the whole text if it seems to contain diagram code
          console.log('No specific diagram syntax found, checking if response looks like a diagram');
          if (text.includes('->') && (text.includes('graph') || text.includes('flowchart'))) {
            console.log('Response contains diagram-like elements, using full text');
            diagramCode = text.trim();
          } else {
            console.error('Could not identify diagram code in response');
            throw new Error('Could not extract Mermaid diagram from response');
          }
        }
      }
      
      console.log('Successfully extracted diagram code, length:', diagramCode.length);
      return diagramCode;
    } catch (error: unknown) {
      console.error('Error generating diagram:', error);
      throw new Error(`Failed to generate diagram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate confidence scores for agent design based on selected tools
   * @param design - The agent design object
   * @param toolSelections - Array of selected tools
   * @returns Object containing confidence scores
   */
  private calculateToolSelectionConfidenceScores(design: any, toolSelections: string[]): any {
    // Initialize confidence score object
    const confidenceScores: any = {
      overall: 0,
      agents: {},
      orchestration: 0,
      toolIntegration: 0
    };
    
    // Calculate confidence scores for each component
    if (design.agents) {
      design.agents.forEach((agent: any) => {
        confidenceScores.agents[agent.name] = this.calculateToolSelectionAgentConfidence(agent, toolSelections);
      });
    }
    
    if (design.tools) {
      design.tools.forEach((tool: any) => {
        confidenceScores.toolIntegration += this.calculateToolSelectionToolConfidence(tool);
      });
    }
    
    if (design.relationships) {
      design.relationships.forEach((rel: any) => {
        confidenceScores.orchestration += this.calculateToolSelectionRelationshipConfidence(rel);
      });
    }
    
    // Calculate overall confidence
    confidenceScores.overall = this.calculateToolSelectionOverallConfidence(design, toolSelections);
    
    return confidenceScores;
  }

  /**
   * Calculate confidence score for an agent based on its characteristics and selected tools
   * @param agent - The agent object 
   * @param toolSelections - Array of selected tools
   * @returns A numerical confidence score (0-100)
   */
  private calculateToolSelectionAgentConfidence(agent: any, toolSelections: string[]): number {
    let score = 0;
    
    // Check for presence of required properties
    if (agent.name && agent.name.length > 0) score += 15;
    if (agent.description && agent.description.length > 20) score += 20;
    if (agent.capabilities && agent.capabilities.length > 0) score += 20;
    
    // Check for tool compatibility
    if (agent.tools && agent.tools.length > 0) {
      const toolCompatibility = agent.tools.filter((tool: string) => 
        toolSelections.includes(tool)
      ).length / agent.tools.length;
      
      score += Math.round(toolCompatibility * 30);
    }
    
    // Cap the score at 100
    return Math.min(100, score);
  }

  /**
   * Calculate confidence score for a tool based on its definition
   * @param tool - The tool object
   * @returns A numerical confidence score (0-100)
   */
  private calculateToolSelectionToolConfidence(tool: any): number {
    let score = 50; // Base score
    
    if (tool.name && tool.name.length > 0) score += 10;
    if (tool.description && tool.description.length > 20) score += 20;
    if (tool.parameters && Array.isArray(tool.parameters)) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Calculate confidence score for a relationship between agents
   * @param relationship - The relationship object
   * @returns A numerical confidence score (0-100)
   */
  private calculateToolSelectionRelationshipConfidence(relationship: any): number {
    let score = 50; // Base score
    
    if (relationship.type && relationship.type.length > 0) score += 15;
    if (relationship.source && relationship.target) score += 15;
    if (relationship.description && relationship.description.length > 10) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Calculate overall confidence score for the entire design
   * @param design - The design object
   * @param toolSelections - Array of selected tools
   * @returns A numerical confidence score (0-100)
   */
  private calculateToolSelectionOverallConfidence(design: any, toolSelections: string[]): number {
    let score = 0;
    
    // Component scores
    if (design.agents && design.agents.length > 0) {
      const agentScores = Object.values(design.agents).map((agent: any) => 
        this.calculateToolSelectionAgentConfidence(agent, toolSelections)
      );
      const avgAgentScore = agentScores.reduce((sum: number, score: number) => sum + score, 0) / agentScores.length;
      score += avgAgentScore * 0.4; // 40% weight
    }
    
    // Tool integration score
    if (design.tools && design.tools.length > 0) {
      const toolScores = design.tools.map((tool: any) => this.calculateToolSelectionToolConfidence(tool));
      const avgToolScore = toolScores.reduce((sum: number, score: number) => sum + score, 0) / toolScores.length;
      score += avgToolScore * 0.3; // 30% weight
    }
    
    // Orchestration score
    if (design.relationships && design.relationships.length > 0) {
      const relScores = design.relationships.map((rel: any) => 
        this.calculateToolSelectionRelationshipConfidence(rel)
      );
      const avgRelScore = relScores.reduce((sum: number, score: number) => sum + score, 0) / relScores.length;
      score += avgRelScore * 0.3; // 30% weight
    }
    
    return Math.min(95, Math.round(score));
  }

  /**
   * Generate initial analysis based on system description
   * @param systemDescription - User's system description
   * @returns Initial analysis with suggested agents and orchestration
   */
  async generateInitialAnalysis(
    systemDescription: string
  ): Promise<InitialAnalysis> {
    try {
      const prompt = `
        Analyze the following system description and suggest an optimal configuration of specialized AI agents, 
        along with an orchestration pattern that would best fulfill the described needs.

        System Description:
        ${systemDescription}

        Please provide:
        1. A brief summary of the system's purpose
        2. 2-5 specialized AI agents that would be needed, including:
           - Agent name
           - Purpose
           - Key capabilities
           - Potential limitations
        3. The most appropriate orchestration pattern (sequential, parallel, conditional, supervisory, hierarchical, or collaborative)
        4. Reasoning for your suggestions

        Format your response as JSON with the following structure:
        {
          "summary": "Brief summary of system purpose",
          "suggestedAgents": [
            {
              "id": "unique-id",
              "name": "Agent Name",
              "description": "Short description",
              "purpose": "Main purpose",
              "capabilities": ["capability1", "capability2", ...],
              "limitations": ["limitation1", "limitation2", ...],
              "tools": []
            },
            ...
          ],
          "suggestedOrchestration": "orchestration-type",
          "reasoning": "Explanation of your recommendations"
        }
      `;

      return await this.withRetry(async () => {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
          // Fix: Extract JSON if it's wrapped in markdown code blocks
          let jsonText = text;
          // Check if response is wrapped in markdown code blocks
          const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
          const match = text.match(jsonRegex);
          
          if (match && match[1]) {
            // Extract the JSON from markdown code block
            jsonText = match[1];
          }
          
          const jsonResponse = JSON.parse(jsonText);
          return jsonResponse as InitialAnalysis;
        } catch (error) {
          console.error("Error parsing AI response:", error);
          throw new Error("Invalid response format from AI model");
        }
      });
    } catch (error) {
      console.error("Error generating initial analysis:", error);
      throw error;
    }
  }

  /**
   * Refine agent design based on tool selections
   * @param initialAnalysis - Initial analysis from generateInitialAnalysis
   * @param toolSelections - Array of tool names selected by user
   * @returns Updated agent definitions with tools assigned
   */
  async refineAgentDesign(
    initialAnalysis: InitialAnalysis,
    toolSelections: string[]
  ): Promise<Agent[]> {
    try {
      const prompt = `
        Based on the initial analysis and the selected tools, refine the agent design 
        to incorporate these tools appropriately among the different agents.

        Initial Analysis:
        ${JSON.stringify(initialAnalysis, null, 2)}

        Selected Tools:
        ${toolSelections.join(", ")}

        Please update the agent definitions to include these tools where appropriate.
        Each agent should only have tools that align with its purpose and capabilities.

        Return the updated array of agents as JSON.
      `;

      return await this.withRetry(async () => {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Raw response from Gemini (first 100 chars):', text.substring(0, 100));
        
        try {
          // Enhanced JSON extraction with multiple fallbacks
          let jsonText = text;
          
          // Try various markdown code block patterns
          const codeBlockPatterns = [
            /```json\s*([\s\S]*?)\s*```/, // JSON code block
            /```javascript\s*([\s\S]*?)\s*```/, // JavaScript code block
            /```js\s*([\s\S]*?)\s*```/, // JS code block
            /```\s*([\s\S]*?)\s*```/, // Any code block
            /`([\s\S]*?)`/, // Inline code
          ];
          
          // Try each pattern until we find a match
          for (const pattern of codeBlockPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
              console.log('Extracted JSON from code block');
              jsonText = match[1].trim();
              break;
            }
          }
          
          // If no code block pattern matched, try to extract JSON directly
          if (jsonText === text) {
            console.log('No code block found, attempting direct JSON extraction');
            
            // Look for array or object literals
            const jsonPattern = /(\[[\s\S]*\]|\{[\s\S]*\})/;
            const match = text.match(jsonPattern);
            
            if (match && match[1]) {
              jsonText = match[1].trim();
              console.log('Extracted JSON directly');
            }
          }
          
          console.log('Attempting to parse extracted content');
          const jsonResponse = JSON.parse(jsonText);
          
          // Handle both array and object responses
          if (Array.isArray(jsonResponse)) {
            return jsonResponse as Agent[];
          } else if (jsonResponse && typeof jsonResponse === 'object') {
            // If it's an object with agents property, return that
            if (Array.isArray(jsonResponse.agents)) {
              return jsonResponse.agents as Agent[];
            } else {
              // Otherwise wrap it in an array
              return [jsonResponse] as Agent[];
            }
          } else {
            throw new Error("Invalid response structure from AI model");
          }
        } catch (error) {
          console.error("Error parsing AI response:", error);
          throw new Error("Invalid response format from AI model");
        }
      });
    } catch (error) {
      console.error("Error refining agent design:", error);
      throw error;
    }
  }

  /**
   * Generate a system diagram for visualization
   * @param agents - Array of agent definitions
   * @param orchestrationType - Type of orchestration pattern
   * @returns Diagram data with nodes and edges
   */
  async generateSystemDiagram(
    agents: Agent[],
    orchestrationType: OrchestrationType
  ): Promise<DiagramData> {
    try {
      console.log('Starting diagram generation with orchestration type:', orchestrationType);
      console.log('Agent count:', agents.length);
      
      // Enhanced prompt requesting detailed styling
      const prompt = `
        Create a system diagram for the following agent configuration and orchestration pattern.

        Agents:
        ${JSON.stringify(agents, null, 2)}

        Orchestration Pattern:
        ${orchestrationType}

        Generate a diagram representation with nodes and edges that can be used in a visualization.
        Format your response as JSON with the following structure:
        {
          "nodes": [
            { 
              "id": "node1", 
              "label": "Agent Name", 
              "type": "agent | tool | memory | data | user | service | decision", 
              "role": "primary | support | specialized",
              "category": "nlu | retrieval | reasoning | planner | memory | tool",
              "description": "Brief description of purpose",
              "size": 1-3 (relative importance, 3 being largest),
              "style": {
                "shape": "circle | hexagon | square | cylinder | cloud",
                "color": "color-code-in-hex"
              }
            },
            ...
          ],
          "edges": [
            { 
              "id": "edge1", 
              "source": "node1", 
              "target": "node2", 
              "label": "interaction type", 
              "type": "control | data | read | write | read-write",
              "style": {
                "lineStyle": "solid | dashed | dotted",
                "thickness": 1-3,
                "color": "color-code-in-hex",
                "bidirectional": true | false
              }
            },
            ...
          ],
          "groups": [
            {
              "id": "group1",
              "label": "Group Name",
              "nodes": ["node1", "node2", ...],
              "style": {
                "color": "color-code-in-hex"
              }
            },
            ...
          ],
          "layout": "hierarchical | dagre | force | circular"
        }
        
        - Represent each agent as a node.
        - If agents use specific tools, represent important tools as nodes linked to the agent.
        - Include nodes for key inputs/outputs, memory stores, and external services if relevant.
        - Define edges representing the flow of control or data between nodes.
        - Use appropriate labels and types for edges to clarify the interactions.
        - Group related nodes together if it improves clarity.
        - Use appropriate visual styling based on node/edge types:
          * Assign colors based on node type/category (e.g., blue for agents, green for tools)
          * Vary node sizes based on importance
          * Use different shapes for different node types
          * Use line styles to differentiate edge types (solid for direct communication, dashed for indirect)
        - Suggest a suitable layout algorithm:
          * 'hierarchical' for manager/worker relationships
          * 'dagre' for sequential/pipeline flows
          * 'force' for collaborative/mesh networks
          * 'circular' for peer-to-peer relationships
      `;

      return await this.withRetry(async () => {
        console.log('Sending diagram generation request to Gemini API');
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Received response from Gemini API for diagram generation');
        console.log('Response text sample (first 100 chars):', text.substring(0, 100));
        
        try {
          // Fix: Extract JSON if it's wrapped in markdown code blocks
          let jsonText = text;
          
          // Check for complete JSON responses first (most common case)
          if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            console.log('Response appears to be direct JSON');
            jsonText = text.trim();
          } else {
            // Extract JSON from markdown code blocks
            const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
            const codeBlockMatch = text.match(codeBlockRegex);
            
            if (codeBlockMatch && codeBlockMatch[1]) {
              console.log('Found JSON in markdown code block');
              jsonText = codeBlockMatch[1].trim();
            } else {
              // Try to extract inline JSON (without code blocks)
              const inlineJsonRegex = /\{[\s\S]*?\}/;
              const inlineMatch = text.match(inlineJsonRegex);
              
              if (inlineMatch) {
                console.log('Found inline JSON');
                jsonText = inlineMatch[0];
              } else {
                console.error('Could not find JSON in the response');
                throw new Error('Invalid response format: no JSON found');
              }
            }
          }
          
          let jsonResponse;
          try {
            jsonResponse = JSON.parse(jsonText);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // Try one more fallback - sometimes there might be extra text at the beginning or end
            const strictJsonMatch = jsonText.match(/(\{[\s\S]*?\})/);
            if (strictJsonMatch && strictJsonMatch[1]) {
              console.log('Attempting stricter JSON extraction');
              jsonResponse = JSON.parse(strictJsonMatch[1]);
            } else {
              throw parseError;
            }
          }
          
          console.log('Successfully parsed JSON, structure:', Object.keys(jsonResponse));
          
          // Validate and normalize the response structure using specific types
          const normalizedResponse: DiagramData = {
            nodes: [],
            edges: [],
            layout: jsonResponse.layout || 'dagre' // Default layout
          };
          
          // Handle nodes with different property names
          const nodeData = jsonResponse.nodes || jsonResponse.vertices || jsonResponse.agents || [];
          if (Array.isArray(nodeData) && nodeData.length > 0) {
            console.log('Found nodes array with', nodeData.length, 'items');
            normalizedResponse.nodes = nodeData.map((node, index): DiagramNode => ({
              id: node.id || `node${index}`,
              label: node.label || node.name || `Node ${index}`,
              type: node.type || 'agent', // Default to agent if type missing
              role: node.role,
              category: node.category,
              description: node.description,
              size: node.size || 1,
              style: node.style || {
                shape: node.shape,
                color: node.color
              }
            }));
          } else {
            // If no nodes are returned, create basic nodes from the input agents
            console.warn('No nodes found in AI response, generating basic nodes from input agents.');
            normalizedResponse.nodes = agents.map((agent): DiagramNode => ({
              id: agent.id,
              label: agent.name,
              type: 'agent',
              description: agent.description
            }));
            if (normalizedResponse.nodes.length === 0) {
              console.error('Invalid diagram structure: missing nodes array and no input agents provided');
              throw new Error('Missing required nodes array in diagram data');
            } 
          }
          
          // Handle edges with different property names
          const edgeData = jsonResponse.edges || jsonResponse.links || jsonResponse.relationships || [];
          if (Array.isArray(edgeData)) { // Allow empty edges array
            console.log('Found edges array with', edgeData.length, 'items');
            normalizedResponse.edges = edgeData.map((edge, index): DiagramEdge => ({
              id: edge.id || `edge${index}`,
              source: edge.source || edge.from || edge.source_id || '',
              target: edge.target || edge.to || edge.target_id || '',
              label: edge.label || '', // Default to empty string if missing
              type: edge.type || 'sequential', // Default type
              style: edge.style || {
                lineStyle: edge.lineStyle,
                thickness: edge.thickness,
                color: edge.color,
                bidirectional: edge.bidirectional
              }
            }));
            
            // Validate edge source/target IDs exist in nodes
            const nodeIds = new Set(normalizedResponse.nodes.map(n => n.id));
            normalizedResponse.edges = normalizedResponse.edges.filter(edge => {
              const sourceExists = nodeIds.has(edge.source);
              const targetExists = nodeIds.has(edge.target);
              if (!sourceExists) console.warn(`Edge ${edge.id} source ID '${edge.source}' not found in nodes.`);
              if (!targetExists) console.warn(`Edge ${edge.id} target ID '${edge.target}' not found in nodes.`);
              return sourceExists && targetExists;
            });
          } else {
             console.warn('No edges array found or invalid format in AI response. Proceeding without edges.');
             normalizedResponse.edges = []; // Ensure edges is an empty array
          }
          
          // Handle groups if present
          if (jsonResponse.groups && Array.isArray(jsonResponse.groups)) {
            normalizedResponse.groups = jsonResponse.groups.map((group: any, index: number) => ({
              id: group.id || `group${index}`,
              label: group.label || group.name || `Group ${index}`,
              nodes: group.nodes || group.nodeIds || [],
              style: group.style || {
                color: group.color
              }
            }));
          }
          
          // Include layout information if available and valid
          if (typeof jsonResponse.layout === 'string' && jsonResponse.layout.trim() !== '') {
            normalizedResponse.layout = jsonResponse.layout;
          } else if (!normalizedResponse.layout) {
             normalizedResponse.layout = 'dagre'; // Ensure layout is set
          }
          
          return normalizedResponse;
        } catch (error) {
          console.error("Error processing AI response for diagram:", error);
          console.error("Raw response text:", text);
          // Attempt to return a basic diagram based on agents if parsing fails severely
          try {
             console.warn("Attempting to generate a fallback basic diagram.");
             const fallbackNodes: DiagramNode[] = agents.map((agent): DiagramNode => ({
                id: agent.id,
                label: agent.name,
                type: 'agent',
                description: agent.description
             }));
             return {
                nodes: fallbackNodes,
                edges: [],
                layout: 'dagre'
             };
          } catch (fallbackError) {
             console.error("Failed to generate fallback diagram:", fallbackError);
             throw new Error("Invalid diagram format from AI model and failed to create fallback.");
          }
        }
      });
    } catch (error) {
      console.error("Error generating system diagram:", error);
      throw error;
    }
  }
}