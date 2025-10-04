import type { Request, Response, NextFunction } from 'express';
import {
  createReview,
  getCustomerReviews,
  getReviewsByProvider,
  getReviewById,
  updateReview,
  deleteReview,
  getCustomerStats
} from '../services/review.service.js';
import { queueService } from '../services/queue.service.js';
import { prisma } from '../utils/database.js';

export const createReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewerId, revieweeId, rating, comment } = req.body;
    const review = await createReview({ reviewerId, revieweeId, rating, comment });
    
    // Send email notification for new review
    try {
      // Get full user data for email notifications
      const [reviewer, reviewee] = await Promise.all([
        prisma.user.findUnique({
          where: { id: reviewerId },
          select: { email: true, firstName: true, lastName: true }
        }),
        prisma.user.findUnique({
          where: { id: revieweeId },
          select: { email: true, firstName: true, lastName: true }
        })
      ]);

      if (reviewer && reviewee) {
        await queueService.sendMessageOrReviewNotification({
          customerEmail: reviewer.email,
          providerEmail: reviewee.email,
          customerName: `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email,
          providerName: `${reviewee.firstName} ${reviewee.lastName}`.trim() || reviewee.email,
          reviewData: {
            rating,
            comment,
            reviewerName: `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email
          },
          notificationType: 'REVIEW',
          metadata: {
            reviewId: review.id,
            rating: rating
          }
        });
        console.log('📧 Review notification email queued successfully');
      }
    } catch (emailError) {
      console.error('❌ Failed to queue review notification email:', emailError);
      // Don't fail the review creation if email fails
    }
    
    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    next(err);
  }
};

export const getCustomerReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const reviews = await getCustomerReviews(customerId, Number(page), Number(limit));
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const getReviewsByProviderController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const reviews = await getReviewsByProvider(providerId, Number(page), Number(limit));
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const getReviewByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const review = await getReviewById(reviewId);
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

export const updateReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const reviewerId = req.body.reviewerId;
    const updateData = req.body;
    const review = await updateReview(reviewId, updateData, reviewerId);
    res.status(200).json({ message: 'Review updated', review });
  } catch (err) {
    next(err);
  }
};

export const deleteReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const reviewerId = req.body.reviewerId;
    const result = await deleteReview(reviewId, reviewerId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getCustomerStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId } = req.params;
    const stats = await getCustomerStats(customerId);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};
