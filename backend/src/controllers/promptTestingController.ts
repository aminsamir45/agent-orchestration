import { Request, Response } from 'express';
import { PromptTestingService } from '../services/promptTestingService';

const promptTestingService = new PromptTestingService();

/**
 * Controller for handling prompt testing endpoints
 */
export const PromptTestingController = {
  /**
   * Save a system description as a test case
   * @param req - Express request object
   * @param res - Express response object
   */
  async saveTestCase(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      
      if (!name || !description) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and description are required'
        });
      }
      
      const result = await promptTestingService.saveTestCase(name, description);
      
      return res.status(result.success ? 200 : 400).json({
        status: result.success ? 'success' : 'error',
        message: result.message
      });
    } catch (error: any) {
      console.error('Error in saveTestCase controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while saving the test case'
      });
    }
  },
  
  /**
   * List all available test cases
   * @param req - Express request object
   * @param res - Express response object
   */
  async listTestCases(req: Request, res: Response) {
    try {
      const testCases = await promptTestingService.listTestCases();
      
      return res.status(200).json({
        status: 'success',
        data: testCases
      });
    } catch (error: any) {
      console.error('Error in listTestCases controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while listing test cases'
      });
    }
  },
  
  /**
   * Run a test case through the Gemini service
   * @param req - Express request object
   * @param res - Express response object
   */
  async runTestCase(req: Request, res: Response) {
    try {
      const { testCase } = req.params;
      
      if (!testCase) {
        return res.status(400).json({
          status: 'error',
          message: 'Test case name is required'
        });
      }
      
      const result = await promptTestingService.runTestCase(testCase);
      
      if ('success' in result && !result.success) {
        return res.status(400).json({
          status: 'error',
          message: result.message
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in runTestCase controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while running the test case'
      });
    }
  },
  
  /**
   * Run a batch of test cases
   * @param req - Express request object
   * @param res - Express response object
   */
  async runBatchTests(req: Request, res: Response) {
    try {
      const { testCases } = req.body;
      
      if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'An array of test case names is required'
        });
      }
      
      const result = await promptTestingService.runBatchTests(testCases);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in runBatchTests controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while running batch tests'
      });
    }
  },
  
  /**
   * Evaluate a test case extraction
   * @param req - Express request object
   * @param res - Express response object
   */
  async evaluateExtraction(req: Request, res: Response) {
    try {
      const { testCase } = req.params;
      const { expectedValues } = req.body;
      
      if (!testCase) {
        return res.status(400).json({
          status: 'error',
          message: 'Test case name is required'
        });
      }
      
      if (!expectedValues || typeof expectedValues !== 'object') {
        return res.status(400).json({
          status: 'error',
          message: 'Expected values object is required'
        });
      }
      
      const result = await promptTestingService.evaluateExtraction(testCase, expectedValues);
      
      if ('success' in result && !result.success) {
        return res.status(400).json({
          status: 'error',
          message: result.message
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error: any) {
      console.error('Error in evaluateExtraction controller:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred while evaluating the extraction'
      });
    }
  }
}; 