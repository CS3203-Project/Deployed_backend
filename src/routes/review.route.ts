import { Router } from 'express';
import {
  createReviewController,
  getUserGivenReviewsController,
  getUserReceivedReviewsController,
  getUserReviewStatusController,
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
  getUserReviewStatsController
} from '../controllers/review.controller.js';

const router: import('express').Router = Router();

// Create a review
router.post('/', createReviewController);

// Get reviews given by a user (as reviewer)
router.get('/user/:userId/given', getUserGivenReviewsController);

// Get reviews received by a user (as reviewee)
router.get('/user/:userId/received', getUserReceivedReviewsController);

// Check if user has reviewed another user
router.get('/user/:userId/reviewed/:revieweeId', getUserReviewStatusController);

// Get a specific review by ID
router.get('/:reviewId', getReviewByIdController);

// Update a review
router.put('/:reviewId', updateReviewController);

// Delete a review
router.delete('/:reviewId', deleteReviewController);

// Get user rating statistics (reviews given by user)
router.get('/user/:userId/stats', getUserReviewStatsController);

export default router;
