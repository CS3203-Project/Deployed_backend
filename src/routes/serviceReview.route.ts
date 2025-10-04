import { Router } from 'express';
import {
  createServiceReviewController,
  getServiceReviewsController,
  getServiceReviewByIdController,
  updateServiceReviewController,
  deleteServiceReviewController,
  getServiceReviewStatsController,
  getServiceReviewsDetailedController,
  getProviderServiceReviewsController,
  getProviderReviewStatsController
} from '../controllers/serviceReview.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: import('express').Router = Router();

// Public routes (no authentication required)
// Get review statistics for a service
router.get('/service/:serviceId/stats', getServiceReviewStatsController);

// Get detailed reviews for a service with stats and filtering
router.get('/service/:serviceId/detailed', getServiceReviewsDetailedController);

// Get all reviews for a service (basic)
router.get('/service/:serviceId', getServiceReviewsController);

// Get all reviews for all services of a provider
router.get('/provider/:providerId', getProviderServiceReviewsController);

// Get review statistics for all services of a provider
router.get('/provider/:providerId/stats', getProviderReviewStatsController);

// Protected routes (authentication required)
router.use(authMiddleware);

// Create a service review
router.post('/', createServiceReviewController);

// Get a single review by id
router.get('/:reviewId', getServiceReviewByIdController);

// Update a review
router.patch('/:reviewId', updateServiceReviewController);

// Delete a review
router.delete('/:reviewId', deleteServiceReviewController);

// Get a single review by id
router.get('/:reviewId', getServiceReviewByIdController);

// Update a review
router.patch('/:reviewId', updateServiceReviewController);

// Delete a review
router.delete('/:reviewId', deleteServiceReviewController);

export default router;
