import express from 'express';
import { SynthesisController } from '../controllers/synthesisController';

const router = express.Router();

/**
 * @route POST /api/synthesis/initial
 * @desc Process initial system description
 * @access Public
 */
router.post('/initial', SynthesisController.processInitialDescription);

/**
 * @route POST /api/synthesis/tools
 * @desc Process tool selections and refine the agent design
 * @access Public
 */
router.post('/tools', SynthesisController.processToolSelections);

/**
 * @route POST /api/synthesis/diagram
 * @desc Generate a diagram based on the refined agent design
 * @access Public
 */
router.post('/diagram', SynthesisController.generateDiagram);

export default router; 