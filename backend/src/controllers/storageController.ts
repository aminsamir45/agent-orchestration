import { Request, Response } from 'express';
import { StorageService } from '../services/storageService';

const storageService = new StorageService();

/**
 * Controller for handling storage-related endpoints
 */
export const StorageController = {
  /**
   * Save a new agent design
   * @param req - Express request object with name and data in body
   * @param res - Express response object
   */
  async saveDesign(req: Request, res: Response) {
    try {
      const { name, data } = req.body;
      
      if (!name || !data) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and data are required'
        });
      }
      
      const design = await storageService.saveDesign(name, data);
      
      return res.status(201).json({
        status: 'success',
        data: design
      });
    } catch (error: any) {
      console.error('Error in saveDesign controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while saving the design'
      });
    }
  },
  
  /**
   * Get a specific design by ID
   * @param req - Express request object with id param
   * @param res - Express response object
   */
  async getDesign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Design ID is required'
        });
      }
      
      const design = await storageService.getDesign(id);
      
      return res.status(200).json({
        status: 'success',
        data: design
      });
    } catch (error: any) {
      console.error('Error in getDesign controller:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while getting the design'
      });
    }
  },
  
  /**
   * List all saved designs
   * @param req - Express request object
   * @param res - Express response object
   */
  async listDesigns(req: Request, res: Response) {
    try {
      const designs = await storageService.listDesigns();
      
      return res.status(200).json({
        status: 'success',
        data: designs
      });
    } catch (error: any) {
      console.error('Error in listDesigns controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while listing designs'
      });
    }
  },
  
  /**
   * Update an existing design
   * @param req - Express request object with id param and updates in body
   * @param res - Express response object
   */
  async updateDesign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (!id || !updates) {
        return res.status(400).json({
          status: 'error',
          message: 'Design ID and updates are required'
        });
      }
      
      const design = await storageService.updateDesign(id, updates);
      
      return res.status(200).json({
        status: 'success',
        data: design
      });
    } catch (error: any) {
      console.error('Error in updateDesign controller:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while updating the design'
      });
    }
  },
  
  /**
   * Delete a design
   * @param req - Express request object with id param
   * @param res - Express response object
   */
  async deleteDesign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          status: 'error',
          message: 'Design ID is required'
        });
      }
      
      const result = await storageService.deleteDesign(id);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in deleteDesign controller:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while deleting the design'
      });
    }
  }
}; 