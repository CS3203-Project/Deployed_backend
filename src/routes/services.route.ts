import { Router } from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceByConversationId,
  searchServices,
  getSimilarServices,
  updateServiceEmbeddings,
  updateAllServiceEmbeddings
} from '../controllers/services.controller.js';
import validate from '../middlewares/validation.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  getServicesQuerySchema,
  serviceIdSchema,
  conversationIdSchema
} from '../validators/services.validator.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: import('express').Router = Router();

// Apply authentication middleware to all routes
// router.use(authMiddleware);

/**
 * @route   POST /api/services
 * @desc    Create a new service
 * @access  Private (Service Provider only)
 */
router.post('/', validate(createServiceSchema), createService);

/**
 * @route   GET /api/services/search
 * @desc    Semantic search for services
 * @access  Public
 */
router.get('/search', searchServices);

/**
 * @route   POST /api/services/embeddings/batch
 * @desc    Batch update embeddings for all services
 * @access  Private (Admin)
 */
router.post('/embeddings/batch', updateAllServiceEmbeddings);

/**
 * @route   GET /api/services
 * @desc    Get all services with optional filtering
 * @access  Public
 */
router.get('/', validate(getServicesQuerySchema, 'query'), getServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get a single service by ID
 * @access  Public
 */
router.get('/:id', validate(serviceIdSchema, 'params'), getServiceById);

/**
 * @route   GET /api/services/conversation/:conversationId
 * @desc    Get a service by conversation ID
 * @access  Public
 */
router.get('/conversation/:conversationId', validate(conversationIdSchema, 'params'), getServiceByConversationId);

/**
 * @route   GET /api/services/:id/similar
 * @desc    Get similar services to a given service
 * @access  Public
 */
router.get('/:id/similar', validate(serviceIdSchema, 'params'), getSimilarServices);

/**
 * @route   POST /api/services/:id/embeddings
 * @desc    Update embeddings for a specific service
 * @access  Private (Admin)
 */
router.post('/:id/embeddings', validate(serviceIdSchema, 'params'), updateServiceEmbeddings);

/**
 * @route   PUT /api/services/:id
 * @desc    Update a service
 * @access  Private (Service Provider - own services only)
 */
router.put('/:id', 
  validate(serviceIdSchema, 'params'),
  validate(updateServiceSchema),
  updateService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete a service
 * @access  Private (Service Provider - own services only)
 */
router.delete('/:id', validate(serviceIdSchema, 'params'), deleteService);

export default router;
