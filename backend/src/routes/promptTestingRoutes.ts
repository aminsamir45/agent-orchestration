import express from 'express';
import { PromptTestingController } from '../controllers/promptTestingController';

const router = express.Router();

/**
 * @route GET /api/prompt-testing/test-cases
 * @desc List all test cases
 * @access Public
 */
router.get('/test-cases', PromptTestingController.listTestCases);

/**
 * @route POST /api/prompt-testing/test-cases
 * @desc Save a test case
 * @access Public
 */
router.post('/test-cases', PromptTestingController.saveTestCase);

/**
 * @route GET /api/prompt-testing/test-cases/:testCase/run
 * @desc Run a test case
 * @access Public
 */
router.get('/test-cases/:testCase/run', PromptTestingController.runTestCase);

/**
 * @route POST /api/prompt-testing/batch-run
 * @desc Run multiple test cases
 * @access Public
 */
router.post('/batch-run', PromptTestingController.runBatchTests);

/**
 * @route POST /api/prompt-testing/test-cases/:testCase/evaluate
 * @desc Evaluate a test case extraction
 * @access Public
 */
router.post('/test-cases/:testCase/evaluate', PromptTestingController.evaluateExtraction);

export default router; 