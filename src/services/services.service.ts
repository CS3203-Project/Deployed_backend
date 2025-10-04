import { prisma } from '../utils/database.js';

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
}

interface ServiceFilters {
  providerId?: string;
  categoryId?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
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
      currency = "USD",
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
      title,
      description,
      price,
      currency,
      tags,
      images,
      isActive,
      workingTime,
      videoUrl // Make sure videoUrl is included
    };

    console.log('Data being sent to Prisma create:', JSON.stringify(createData, null, 2));
    console.log('VideoUrl in create data:', createData.videoUrl);

    // Create the service
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

    return newService;
  } catch (error) {
    console.error('=== SERVICE SERVICE ERROR ===');
    console.error('Error in createService:', error);
    throw new Error(`Failed to create service: ${error.message}`);
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

    return services;
  } catch (error) {
    throw new Error(`Failed to fetch services: ${error.message}`);
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

    return service;
  } catch (error) {
    throw new Error(`Failed to fetch service: ${error.message}`);
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

    return updatedService;
  } catch (error) {
    throw new Error(`Failed to update service: ${error.message}`);
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
    throw new Error(`Failed to delete service: ${error.message}`);
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

    return conversation.service;
  } catch (error) {
    throw new Error(`Failed to fetch service by conversation ID: ${error.message}`);
  }
};

