import { prisma } from '../utils/database.js';
import { embeddingService } from './embedding.service.js';

// Type definitions
interface ServiceCreateData {
  providerId: string;
  categoryId: string;
  title?: string;
  description?: string;
  price: number;
  currency?: string;
  tags?: string[];
  images?: string[];
  videoUrl?: string;  // Add videoUrl to interface
  isActive?: boolean;
  workingTime?: string[];
  // Location fields
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  serviceRadiusKm?: number;
  locationLastUpdated?: Date;
}

interface ServiceFilters {
  providerId?: string;
  categoryId?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}

interface LocationSearchOptions {
  latitude: number;
  longitude: number;
  radius: number;
  page: number;
  limit: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Create a new service
 * @param {ServiceCreateData} serviceData - The service data
 * @returns {Promise<Object>} Created service object
 */
export const createService = async (serviceData: ServiceCreateData) => {
  try {
    console.log('=== SERVICE SERVICE DEBUG ===');
    console.log('Service data received in service layer:', JSON.stringify(serviceData, null, 2));
    
    const {
      providerId,
      categoryId,
      title,
      description,
      price,
      currency = "LKR",
      tags = [],
      images = [],
      isActive = true,
      workingTime = []
    } = serviceData;

    // Debug: Extract videoUrl specifically
    const videoUrl = serviceData.videoUrl;
    console.log('Extracted videoUrl:', videoUrl);
    console.log('VideoUrl type:', typeof videoUrl);

    // Validate required fields
    if (!providerId) {
      throw new Error('Provider ID is required');
    }
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    if (price === undefined || price === null) {
      throw new Error('Price is required');
    }

    // Validate that provider exists
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId }
    });
    if (!provider) {
      throw new Error('Service provider not found');
    }

    // Validate that category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      throw new Error('Category not found');
    }

    // Prepare data for Prisma create
    const createData = {
      providerId,
      categoryId,
      title: title ?? null,
      description: description ?? null,
      price,
      currency,
      tags,
      images,
      isActive,
      workingTime,
      videoUrl: videoUrl ?? null, // Ensure videoUrl is null if undefined
      // Location fields
      latitude: serviceData.latitude ?? null,
      longitude: serviceData.longitude ?? null,
      address: serviceData.address ?? null,
      city: serviceData.city ?? null,
      state: serviceData.state ?? null,
      country: serviceData.country ?? null,
      postalCode: serviceData.postalCode ?? null,
      serviceRadiusKm: serviceData.serviceRadiusKm ?? null,
      locationLastUpdated: serviceData.locationLastUpdated ?? null
    };

    console.log('Data being sent to Prisma create:', JSON.stringify(createData, null, 2));
    console.log('VideoUrl in create data:', createData.videoUrl);

    // Create the service first
    const newService = await prisma.service.create({
      data: createData,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        category: true
      }
    });

    console.log('Service created by Prisma. Checking result...');
    console.log('Service ID:', newService.id);
    console.log('Service videoUrl field:', (newService as any).videoUrl);

    // Generate and update embeddings for the newly created service
    try {
      console.log('Generating embeddings for service:', newService.id);
      const embeddings = await embeddingService.generateServiceEmbeddings({
        title: newService.title ?? "",
        description: newService.description ?? "",
        tags: newService.tags
      });

      // Update service with embeddings using raw query
      await prisma.$executeRaw`
        UPDATE "Service" 
        SET 
          "titleEmbedding" = ${`[${embeddings.titleEmbedding.join(',')}]`}::vector,
          "descriptionEmbedding" = ${`[${embeddings.descriptionEmbedding.join(',')}]`}::vector,
          "tagsEmbedding" = ${`[${embeddings.tagsEmbedding.join(',')}]`}::vector,
          "combinedEmbedding" = ${`[${embeddings.combinedEmbedding.join(',')}]`}::vector,
          "embeddingUpdatedAt" = NOW()
        WHERE id = ${newService.id}
      `;

      console.log('✅ Embeddings generated and stored for service:', newService.id);
    } catch (embeddingError) {
      console.warn('⚠️ Failed to generate embeddings for service:', newService.id, embeddingError);
      // Don't fail the service creation if embedding generation fails
    }

    return newService;
  } catch (error) {
    console.error('=== SERVICE SERVICE ERROR ===');
    console.error('Error in createService:', error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to create service: ${errorMessage}`);
  }
};

/**
 * Get all services with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} [filters.providerId] - Filter by provider ID
 * @param {string} [filters.categoryId] - Filter by category ID
 * @param {boolean} [filters.isActive] - Filter by active status
 * @param {number} [filters.skip=0] - Number of records to skip for pagination
 * @param {number} [filters.take=10] - Number of records to take for pagination
 * @returns {Promise<Object[]>} Array of service objects
 */
export const getServices = async (filters: ServiceFilters = {}) => {
  try {
    const {
      providerId,
      categoryId,
      isActive = true, // Default to active services only
      skip = 0,
      take = 20 // Increased default for better UX
    } = filters;

    const whereClause: any = {};
    
    if (providerId) whereClause.providerId = providerId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const services = await prisma.service.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        serviceReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            serviceReviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each service
    const servicesWithRating = services.map(service => {
      const reviewCount = service._count.serviceReviews;
      let averageRating = 0;
      
      if (reviewCount > 0 && service.serviceReviews.length > 0) {
        const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / service.serviceReviews.length;
      }
      
      // Debug logging
      console.log(`Service ${service.id} (${service.title}): reviewCount=${reviewCount}, averageRating=${averageRating}, reviews=${JSON.stringify(service.serviceReviews)}`);
      
      // Remove the serviceReviews array from the response to keep it clean
      const { serviceReviews, ...serviceData } = service;
      
      return {
        ...serviceData,
        averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
        reviewCount
      };
    });

    console.log('Returning services with ratings:', servicesWithRating.map(s => ({ id: s.id, title: s.title, averageRating: s.averageRating, reviewCount: s.reviewCount })));
    return servicesWithRating;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch services: ${errorMessage}`);
  }
};

/**
 * Get a single service by ID
 * @param {string} serviceId - The service ID
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export const getServiceById = async (serviceId: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        serviceReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            serviceReviews: true,
            schedules: true
          }
        }
      }
    });

    console.log('=== GET SERVICE BY ID DEBUG ===');
    console.log('Service found:', service?.id);
    console.log('Service videoUrl:', (service as any)?.videoUrl);

    if (!service) {
      return null;
    }

    // Calculate average rating
    const reviewCount = service._count.serviceReviews;
    let averageRating = 0;
    
    if (reviewCount > 0 && service.serviceReviews.length > 0) {
      const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / service.serviceReviews.length;
    }
    
    // Remove the serviceReviews array from the response to keep it clean
    const { serviceReviews, ...serviceData } = service;
    
    return {
      ...serviceData,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
      reviewCount
    };
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch service: ${errorMessage}`);
  }
};

/**
 * Update a service
 * @param {string} serviceId - The service ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated service object
 */
export const updateService = async (serviceId: string, updateData: Partial<ServiceCreateData>) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Check if content that affects embeddings has changed
    const contentChanged = (
      (updateData.title !== undefined && updateData.title !== service.title) ||
      (updateData.description !== undefined && updateData.description !== service.description) ||
      (updateData.tags !== undefined && JSON.stringify(updateData.tags) !== JSON.stringify(service.tags))
    );

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        category: true
      }
    });

    // Regenerate embeddings if content changed
    if (contentChanged) {
      try {
        console.log('Content changed, regenerating embeddings for service:', serviceId);
        const embeddings = await embeddingService.generateServiceEmbeddings({
          title: updatedService.title ?? "",
          description: updatedService.description ?? "",
          tags: updatedService.tags
        });

        // Update service with new embeddings using raw query
        await prisma.$executeRaw`
          UPDATE "Service" 
          SET 
            "titleEmbedding" = ${`[${embeddings.titleEmbedding.join(',')}]`}::vector,
            "descriptionEmbedding" = ${`[${embeddings.descriptionEmbedding.join(',')}]`}::vector,
            "tagsEmbedding" = ${`[${embeddings.tagsEmbedding.join(',')}]`}::vector,
            "combinedEmbedding" = ${`[${embeddings.combinedEmbedding.join(',')}]`}::vector,
            "embeddingUpdatedAt" = NOW()
          WHERE id = ${serviceId}
        `;

        console.log('✅ Embeddings regenerated for updated service:', serviceId);
      } catch (embeddingError) {
        console.warn('⚠️ Failed to regenerate embeddings for service:', serviceId, embeddingError);
        // Don't fail the service update if embedding generation fails
      }
    }

    return updatedService;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to update service: ${errorMessage}`);
  }
};

/**
 * Delete a service
 * @param {string} serviceId - The service ID
 * @returns {Promise<Object>} Deleted service object
 */
export const deleteService = async (serviceId: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const deletedService = await prisma.service.delete({
      where: { id: serviceId }
    });

    return deletedService;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to delete service: ${errorMessage}`);
  }
};

/**
 * Get a service by conversation ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export const getServiceByConversationId = async (conversationId: string) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        service: {
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    imageUrl: true
                  }
                }
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            },
            serviceReviews: {
              select: {
                rating: true
              }
            },
            _count: {
              select: {
                serviceReviews: true,
                schedules: true
              }
            }
          }
        }
      }
    });

    if (!conversation || !conversation.service) {
      return null;
    }

    const service = conversation.service;
    
    // Calculate average rating
    const reviewCount = service._count.serviceReviews;
    let averageRating = 0;
    
    if (reviewCount > 0 && service.serviceReviews.length > 0) {
      const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / service.serviceReviews.length;
    }
    
    // Remove the serviceReviews array from the response to keep it clean
    const { serviceReviews, ...serviceData } = service;
    
    return {
      ...serviceData,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
      reviewCount
    };
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch service by conversation ID: ${errorMessage}`);
  }
};

/**
 * Search services by location using PostGIS spatial queries
 * @param {LocationSearchOptions} options - Search options
 * @returns {Promise<Object>} Services and pagination info
 */
export const searchServicesByLocation = async (options: LocationSearchOptions) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      page,
      limit,
      categoryId,
      minPrice,
      maxPrice
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause for additional filters
    let whereConditions = ['s."isActive" = true'];
    const queryParams: any[] = [longitude, latitude, radius * 1000, limit, offset]; // radius in meters
    let paramIndex = 6;

    if (categoryId) {
      whereConditions.push(`s."categoryId" = $${paramIndex}`);
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      whereConditions.push(`s.price >= $${paramIndex}`);
      queryParams.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      whereConditions.push(`s.price <= $${paramIndex}`);
      queryParams.push(maxPrice);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query to get services within radius
    const servicesQuery = `
      SELECT 
        s.*,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance_km,
        sp.id as provider_id,
        sp."averageRating" as provider_average_rating,
        sp."totalReviews" as provider_total_reviews,
        u."firstName" as provider_first_name,
        u."lastName" as provider_last_name,
        u."imageUrl" as provider_image_url,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(AVG(sr.rating), 0) as average_rating,
        COUNT(sr.id) as review_count
      FROM "Service" s
      INNER JOIN "ServiceProvider" sp ON s."providerId" = sp.id
      INNER JOIN "User" u ON sp."userId" = u.id
      INNER JOIN "Category" c ON s."categoryId" = c.id
      LEFT JOIN "ServiceReview" sr ON s.id = sr."serviceId"
      ${whereClause}
      AND s.latitude IS NOT NULL 
      AND s.longitude IS NOT NULL
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      GROUP BY s.id, sp.id, u.id, c.id
      ORDER BY distance_km ASC
      LIMIT $4 OFFSET $5
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM "Service" s
      ${whereClause}
      AND s.latitude IS NOT NULL 
      AND s.longitude IS NOT NULL
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    // Execute queries
    const [servicesResult, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(servicesQuery, ...queryParams),
      prisma.$queryRawUnsafe(countQuery, longitude, latitude, radius * 1000, ...queryParams.slice(5, paramIndex - 1))
    ]);

    const services = servicesResult as any[];
    const total = parseInt((countResult as any[])[0].count);

    // Format the results
    const formattedServices = services.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      currency: service.currency,
      tags: service.tags,
      images: service.images,
      videoUrl: service.videoUrl,
      isActive: service.isActive,
      workingTime: service.workingTime,
      latitude: parseFloat(service.latitude),
      longitude: parseFloat(service.longitude),
      address: service.address,
      city: service.city,
      state: service.state,
      country: service.country,
      postalCode: service.postalCode,
      serviceRadiusKm: service.serviceRadiusKm ? parseFloat(service.serviceRadiusKm) : null,
      distance_km: parseFloat(service.distance_km),
      averageRating: service.average_rating ? parseFloat(parseFloat(service.average_rating).toFixed(1)) : 0,
      reviewCount: parseInt(service.review_count) || 0,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      provider: {
        id: service.provider_id,
        averageRating: service.provider_average_rating ? parseFloat(service.provider_average_rating) : null,
        totalReviews: service.provider_total_reviews,
        user: {
          firstName: service.provider_first_name,
          lastName: service.provider_last_name,
          imageUrl: service.provider_image_url
        }
      },
      category: {
        name: service.category_name,
        slug: service.category_slug
      }
    }));

    return {
      services: formattedServices,
      total
    };
  } catch (error) {
    console.error('Location search error:', error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to search services by location: ${errorMessage}`);
  }
};
