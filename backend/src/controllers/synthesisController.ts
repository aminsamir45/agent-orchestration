import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { Agent, InitialAnalysis, OrchestrationType } from '../types';

const geminiService = new GeminiService();

/**
 * Controller for handling synthesis-related endpoints
 */
export const SynthesisController = {
  /**
   * Process the initial system description
   * @param req - Express request object with systemDescription in body
   * @param res - Express response object
   */
  async processInitialDescription(req: Request, res: Response) {
    try {
      const { systemDescription } = req.body;
      
      if (!systemDescription || typeof systemDescription !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'System description is required and must be a string'
        });
      }
      
      // Use the new generateInitialAnalysis method
      const result = await geminiService.generateInitialAnalysis(systemDescription);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in processInitialDescription controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while processing the system description'
      });
    }
  },
  
  /**
   * Process tool selections and refine the agent design
   * @param req - Express request object with initialAnalysis and toolSelections in body
   * @param res - Express response object
   */
  async processToolSelections(req: Request, res: Response) {
    try {
      const { initialAnalysis, toolSelections } = req.body;
      
      // Enhanced validation for better error handling
      if (!initialAnalysis) {
        return res.status(400).json({
          status: 'error',
          message: 'Initial analysis is required'
        });
      }
      
      if (!toolSelections) {
        return res.status(400).json({
          status: 'error',
          message: 'Tool selections are required'
        });
      }
      
      if (!Array.isArray(toolSelections)) {
        return res.status(400).json({
          status: 'error',
          message: 'Tool selections must be an array'
        });
      }
      
      // Validate the initial analysis contains essential components
      if (!initialAnalysis.suggestedAgents || !Array.isArray(initialAnalysis.suggestedAgents)) {
        return res.status(400).json({
          status: 'error',
          message: 'Initial analysis must contain a suggestedAgents array'
        });
      }
      
      // Log the request for debugging
      console.log('Processing tool selections:', {
        agentCount: initialAnalysis.suggestedAgents.length,
        toolCount: toolSelections.length
      });
      
      // Use the new refineAgentDesign method
      const updatedAgents = await geminiService.refineAgentDesign(initialAnalysis, toolSelections);
      
      // Log successful processing
      console.log('Tool selections processed successfully');
      
      return res.status(200).json({
        status: 'success',
        data: {
          agents: updatedAgents,
          orchestrationType: initialAnalysis.suggestedOrchestration
        }
      });
    } catch (error: any) {
      console.error('Error in processToolSelections controller:', error);
      
      // Provide more helpful error messages based on error type
      if (error.message.includes('Failed to extract')) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to process the AI response. Please try again.'
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while processing tool selections'
      });
    }
  },
  
  /**
   * Generate a diagram based on the refined agent design
   * @param req - Express request object with agents and orchestrationType in body
   * @param res - Express response object
   */
  async generateDiagram(req: Request, res: Response) {
    try {
      const { agents, orchestrationType } = req.body;
      
      if (!agents || !Array.isArray(agents)) {
        return res.status(400).json({
          status: 'error',
          message: 'Agents array is required'
        });
      }
      
      if (!orchestrationType) {
        return res.status(400).json({
          status: 'error',
          message: 'Orchestration type is required'
        });
      }
      
      console.log('Generating diagram with', agents.length, 'agents and orchestration type:', orchestrationType);
      
      try {
        // Use the new generateSystemDiagram method
        const diagram = await geminiService.generateSystemDiagram(agents, orchestrationType as OrchestrationType);
        
        console.log('Diagram generated successfully with', 
          diagram.nodes?.length || 0, 'nodes and', 
          diagram.edges?.length || 0, 'edges');
        
        return res.status(200).json({
          status: 'success',
          data: diagram
        });
      } catch (error: any) {
        console.error('Diagram generation failed:', error.message);
        // More specific error for diagram generation failures
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate the diagram: ' + error.message,
          errorCode: 'DIAGRAM_GENERATION_FAILED'
        });
      }
    } catch (error: any) {
      console.error('Error in generateDiagram controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while generating the diagram'
      });
    }
  }
}; 