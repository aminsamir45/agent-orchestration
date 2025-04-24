// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * API client for interacting with the backend services
 */
const apiClient = {
  /**
   * Process the initial system description
   * @param systemDescription - User's description of the agent system
   * @returns Initial analysis with suggested agents and orchestration
   */
  async processSystemDescription(systemDescription: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/synthesis/initial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemDescription }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error processing system description:', error);
      throw error;
    }
  },
  
  /**
   * Process tool selections and refine the agent design
   * @param initialAnalysis - The results from the first analysis
   * @param toolSelections - Tools selected by the user
   * @returns Updated agents with tools assigned appropriately
   */
  async processToolSelections(initialAnalysis: any, toolSelections: string[]) {
    try {
      const response = await fetch(`${API_BASE_URL}/synthesis/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initialAnalysis, toolSelections }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error processing tool selections:', error);
      throw error;
    }
  },
  
  /**
   * Generate a diagram based on the refined design
   * @param refinedDesign - The refined agent design data
   * @returns Diagram data with nodes and edges
   */
  async generateDiagram(refinedDesign: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/synthesis/diagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refinedDesign),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error generating diagram:', error);
      throw error;
    }
  },
  
  /**
   * Save an agent design
   * @param name - Name for the design
   * @param data - The design data to save
   * @returns The saved design with ID
   */
  async saveDesign(name: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, data }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  },
  
  /**
   * List all saved designs
   * @returns Array of saved designs
   */
  async listDesigns() {
    try {
      const response = await fetch(`${API_BASE_URL}/storage`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error listing designs:', error);
      throw error;
    }
  },
  
  /**
   * Execute an agent design with a user query
   * @param designId - ID of the design to execute
   * @param query - User query to process
   * @returns Execution results
   */
  async executeAgentSystem(designId: string, query: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/execution/${designId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error executing agent system:', error);
      throw error;
    }
  },
};

export default apiClient; 