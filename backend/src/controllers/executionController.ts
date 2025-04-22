import { Request, Response } from 'express';
import { ExecutionService } from '../services/executionService';
import { StorageService } from '../services/storageService';

const executionService = new ExecutionService();
const storageService = new StorageService();

/**
 * Controller for handling execution-related endpoints
 */
export const ExecutionController = {
  /**
   * Execute an agent design with a user query
   * @param req - Express request object with id param and query in body
   * @param res - Express response object
   */
  async executeAgentSystem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { query } = req.body;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Design ID is required'
        });
      }
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Query is required and must be a string'
        });
      }
      
      // Get the design from storage
      const design = await storageService.getDesign(id);
      
      // Execute the agent system
      const result = await executionService.executeAgentSystem(design.data, query);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in executeAgentSystem controller:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while executing the agent system'
      });
    }
  },
  
  /**
   * Generate executable code for a design
   * @param req - Express request object with id param
   * @param res - Express response object
   */
  async generateExecutableCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Design ID is required'
        });
      }
      
      // Get the design from storage
      const design = await storageService.getDesign(id);
      
      // Generate executable code
      const result = await executionService.generateExecutableCode(design.data);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in generateExecutableCode controller:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while generating executable code'
      });
    }
  }
}; 