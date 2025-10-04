import { Router } from 'express';
import {
  createReviewController,
  getCustomerReviewsController,
  getReviewsByProviderController,
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
  getCustomerStatsController
} from '../controllers/review.controller.js';

const router: import('express').Router = Router();

// Create a review
router.post('/', createReviewController);

// Get all reviews for a specific customer
router.get('/customer/:customerId', getCustomerReviewsController);

// Get all reviews written by a service provider
router.get('/provider/:providerId', getReviewsByProviderController);

// Get a specific review by ID
router.get('/:reviewId', getReviewByIdController);

// Update a review
router.put('/:reviewId', updateReviewController);

// Delete a review
router.delete('/:reviewId', deleteReviewController);

// Get customer statistics (average rating, total reviews, rating distribution)
router.get('/customer/:customerId/stats', getCustomerStatsController);

export default router;
