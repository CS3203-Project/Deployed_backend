import {
  createServiceReview,
  getServiceReviews,
  getServiceReviewById,
  updateServiceReview,
  deleteServiceReview,
  getServiceReviewStats,
  getServiceReviewsDetailed,
  getProviderServiceReviews,
  getProviderReviewStats,
  CreateServiceReviewData,
  UpdateServiceReviewData
} from '../services/serviceReview.service.js';
import { Request, Response } from 'express';

export const createServiceReviewController = async (req: Request, res: Response) => {
  try {
    const data: CreateServiceReviewData = req.body;
    // reviewerId should come from auth middleware (req.user.id)
    data.reviewerId = req.user.id;
    const review = await createServiceReview(data);
    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getServiceReviewsController = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const result = await getServiceReviews(serviceId!, Number(page), Number(limit));
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getServiceReviewByIdController = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await getServiceReviewById(reviewId!);
    res.json(review);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const updateServiceReviewController = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const data: UpdateServiceReviewData = req.body;
    const userId = req.user.id;
    const review = await updateServiceReview(reviewId!, data, userId);
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteServiceReviewController = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const result = await deleteServiceReview(reviewId!, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getServiceReviewStatsController = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const stats = await getServiceReviewStats(serviceId!);
    res.json({
      success: true,
      message: 'Service review statistics retrieved successfully',
      data: stats
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const getServiceReviewsDetailedController = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    
    const ratingFilter = rating ? Number(rating) : undefined;
    const result = await getServiceReviewsDetailed(
      serviceId!, 
      Number(page), 
      Number(limit), 
      ratingFilter
    );
    
    res.json({
      success: true,
      message: 'Service reviews retrieved successfully',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const getProviderServiceReviewsController = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    
    const ratingFilter = rating ? Number(rating) : undefined;
    const result = await getProviderServiceReviews(
      providerId!, 
      Number(page), 
      Number(limit), 
      ratingFilter
    );
    
    res.json({
      success: true,
      message: 'Provider service reviews retrieved successfully',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

export const getProviderReviewStatsController = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const stats = await getProviderReviewStats(providerId!);
    res.json({
      success: true,
      message: 'Provider review statistics retrieved successfully',
      data: stats
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};
