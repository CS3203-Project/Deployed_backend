import { Router } from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceByConversationId,
  searchServices,
  hybridSearchServices,
  getSimilarServices,
  updateServiceEmbeddings,
  updateAllServiceEmbeddings,
  searchServicesByLocation,
  getLocationFromIP,
  geocodeAddress,
  reverseGeocode
} from '../controllers/services.controller.js';
import validate from '../middlewares/validation.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  getServicesQuerySchema,
  serviceIdSchema,
  conversationIdSchema,
  searchServicesByLocationSchema,
  geocodeAddressSchema,
  reverseGeocodeSchema
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
 * @route   GET /api/services/search/hybrid
 * @desc    Hybrid search for services (semantic + location)
 * @access  Public
 */
router.get('/search/hybrid', hybridSearchServices);

/**
 * @route   GET /api/services/search
 * @desc    Semantic search for services
 * @access  Public
 */
router.get('/search', searchServices);

/**
 * @route   GET /api/services/search/location
 * @desc    Search services by location with radius filtering
 * @access  Public
 */
router.get('/search/location', validate(searchServicesByLocationSchema, 'query'), searchServicesByLocation);

/**
 * @route   GET /api/services/location/ip
 * @desc    Get location information from IP address
 * @access  Public
 */
router.get('/location/ip', getLocationFromIP);

/**
 * @route   POST /api/services/location/geocode
 * @desc    Convert address to coordinates
 * @access  Public
 */
router.post('/location/geocode', validate(geocodeAddressSchema), geocodeAddress);

/**
 * @route   POST /api/services/location/reverse-geocode
 * @desc    Convert coordinates to address
 * @access  Public
 */
router.post('/location/reverse-geocode', validate(reverseGeocodeSchema), reverseGeocode);

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