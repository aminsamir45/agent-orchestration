import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';

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
      
      const result = await geminiService.processInitialDescription(systemDescription);
      
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
      
      if (!initialAnalysis || !toolSelections || !Array.isArray(toolSelections)) {
        return res.status(400).json({
          status: 'error',
          message: 'Initial analysis and tool selections array are required'
        });
      }
      
      const result = await geminiService.processToolSelections(initialAnalysis, toolSelections);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in processToolSelections controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while processing tool selections'
      });
    }
  },
  
  /**
   * Generate a diagram based on the refined agent design
   * @param req - Express request object with refinedDesign in body
   * @param res - Express response object
   */
  async generateDiagram(req: Request, res: Response) {
    try {
      const { refinedDesign } = req.body;
      
      if (!refinedDesign) {
        return res.status(400).json({
          status: 'error',
          message: 'Refined design is required'
        });
      }
      
      const result = await geminiService.generateDiagram(refinedDesign);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in generateDiagram controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while generating the diagram'
      });
    }
  }
}; 