import express from 'express';
import { ExecutionController } from '../controllers/executionController';

const router = express.Router();

/**
 * @route POST /api/execution/:id/run
 * @desc Execute an agent design with a user query
 * @access Public
 */
router.post('/:id/run', ExecutionController.executeAgentSystem);

/**
 * @route GET /api/execution/:id/code
 * @desc Generate executable code for a design
 * @access Public
 */
router.get('/:id/code', ExecutionController.generateExecutableCode);

export default router; 