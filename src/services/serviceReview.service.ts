// ServiceReview Service - mirrors customerReview.service.ts but for ServiceReview
import { prisma } from '../utils/database.js';

export interface CreateServiceReviewData {
  reviewerId: string; // customer id
  serviceId: string;
  rating: number;
  comment?: string;
}

export interface UpdateServiceReviewData {
  rating?: number;
  comment?: string;
}

export const createServiceReview = async (data: CreateServiceReviewData) => {
  // Prevent duplicate reviews by same user for same service
  const existing = await prisma.serviceReview.findFirst({
    where: { reviewerId: data.reviewerId, serviceId: data.serviceId }
  });
  if (existing) throw new Error('You have already reviewed this service.');
  return prisma.serviceReview.create({
    data,
    include: {
      reviewer: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      service: { select: { id: true, title: true } }
    }
  });
};

export const getServiceReviews = async (serviceId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.serviceReview.findMany({
      where: { serviceId },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        service: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit
    }),
    prisma.serviceReview.count({ where: { serviceId } })
  ]);
  return { reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getServiceReviewById = async (reviewId: string) => {
  const review = await prisma.serviceReview.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      service: { select: { id: true, title: true } }
    }
  });
  if (!review) throw new Error('Service review not found');
  return review;
};

export const updateServiceReview = async (reviewId: string, data: UpdateServiceReviewData, userId: string) => {
  const existing = await prisma.serviceReview.findUnique({ where: { id: reviewId } });
  if (!existing) throw new Error('Review not found');
  if (existing.reviewerId !== userId) throw new Error('Unauthorized');
  return prisma.serviceReview.update({
    where: { id: reviewId },
    data: { ...data, updatedAt: new Date() },
    include: {
      reviewer: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      service: { select: { id: true, title: true } }
    }
  });
};

export const deleteServiceReview = async (reviewId: string, userId: string) => {
  const existing = await prisma.serviceReview.findUnique({ where: { id: reviewId } });
  if (!existing) throw new Error('Review not found');
  if (existing.reviewerId !== userId) throw new Error('Unauthorized');
  await prisma.serviceReview.delete({ where: { id: reviewId } });
  return { message: 'Service review deleted successfully' };
};

export const getServiceReviewStats = async (serviceId: string) => {
  const reviews = await prisma.serviceReview.findMany({
    where: { serviceId },
    select: { rating: true }
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
    ratingDistribution
  };
};

export const getServiceReviewsDetailed = async (serviceId: string, page = 1, limit = 10, ratingFilter?: number) => {
  const skip = (page - 1) * limit;
  
  const whereClause: any = { serviceId };
  if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
    whereClause.rating = ratingFilter;
  }

  const [reviews, total, stats] = await Promise.all([
    prisma.serviceReview.findMany({
      where: whereClause,
      include: {
        reviewer: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            imageUrl: true 
          } 
        },
        service: { 
          select: { 
            id: true, 
            title: true 
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      skip, 
      take: limit
    }),
    prisma.serviceReview.count({ where: whereClause }),
    getServiceReviewStats(serviceId)
  ]);

  // Transform reviews to match frontend format
  const transformedReviews = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment || '',
    clientName: `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'Anonymous',
    clientAvatar: review.reviewer.imageUrl || `https://picsum.photos/seed/${review.reviewer.id}/60/60`,
    date: review.createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
    helpful: 0, // We don't have helpful votes yet, default to 0
    service: review.service.title,
    reviewerId: review.reviewer.id,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  }));

  return {
    reviews: transformedReviews,
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages: Math.ceil(total / limit) 
    },
    stats
  };
};

// Get all reviews for all services of a specific provider
export const getProviderServiceReviews = async (providerId: string, page = 1, limit = 10, ratingFilter?: number) => {
  const skip = (page - 1) * limit;
  
  const whereClause: any = { 
    service: { 
      providerId: providerId 
    } 
  };
  
  if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
    whereClause.rating = ratingFilter;
  }

  const [reviews, total] = await Promise.all([
    prisma.serviceReview.findMany({
      where: whereClause,
      include: {
        reviewer: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            imageUrl: true 
          } 
        },
        service: { 
          select: { 
            id: true, 
            title: true,
            images: true,
            category: {
              select: {
                name: true
              }
            }
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      skip, 
      take: limit
    }),
    prisma.serviceReview.count({ where: whereClause })
  ]);

  // Transform reviews to match frontend format
  const transformedReviews = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment || '',
    clientName: `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'Anonymous',
    clientAvatar: review.reviewer.imageUrl || `https://picsum.photos/seed/${review.reviewer.id}/60/60`,
    date: review.createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
    helpful: 0, // We don't have helpful votes yet, default to 0
    service: {
      id: review.service.id,
      title: review.service.title,
      image: review.service.images && review.service.images.length > 0 ? review.service.images[0] : null,
      category: review.service.category?.name || 'Uncategorized'
    },
    reviewerId: review.reviewer.id,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  }));

  return {
    reviews: transformedReviews,
    pagination: { 
      page, 
      limit, 
      total, 
      totalPages: Math.ceil(total / limit) 
    }
  };
};

// Get review statistics for all services of a provider
export const getProviderReviewStats = async (providerId: string) => {
  const reviews = await prisma.serviceReview.findMany({
    where: { 
      service: { 
        providerId: providerId 
      } 
    },
    select: { rating: true }
  });

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews,
    ratingDistribution
  };
};
