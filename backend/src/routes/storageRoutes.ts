import express from 'express';
import { StorageController } from '../controllers/storageController';

const router = express.Router();

/**
 * @route GET /api/storage
 * @desc List all saved designs
 * @access Public
 */
router.get('/', StorageController.listDesigns);

/**
 * @route POST /api/storage
 * @desc Save a new agent design
 * @access Public
 */
router.post('/', StorageController.saveDesign);

/**
 * @route GET /api/storage/:id
 * @desc Get a specific design by ID
 * @access Public
 */
router.get('/:id', StorageController.getDesign);

/**
 * @route PUT /api/storage/:id
 * @desc Update an existing design
 * @access Public
 */
router.put('/:id', StorageController.updateDesign);

/**
 * @route DELETE /api/storage/:id
 * @desc Delete a design
 * @access Public
 */
router.delete('/:id', StorageController.deleteDesign);

export default router; 