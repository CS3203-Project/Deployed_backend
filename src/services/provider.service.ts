import { prisma } from '../utils/database.js';

// Type definitions
interface ProviderCreateData {
  bio?: string;
  skills?: string[];
  qualifications?: string[];
  logoUrl?: string;
  IDCardUrl?: string;
}

interface ProviderUpdateData {
  bio?: string;
  skills?: string[];
  qualifications?: string[];
  logoUrl?: string;
  IDCardUrl?: string;
}

export const createProvider = async (userId: string, providerData: ProviderCreateData) => {
  // Check if user exists and doesn't already have a provider profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { serviceProvider: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.serviceProvider) {
    throw new Error('User already has a service provider profile');
  }

  // Update user role to PROVIDER and create ServiceProvider profile
  const [updatedUser, newProvider] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { role: 'PROVIDER' }
    }),
    prisma.serviceProvider.create({
      data: {
        userId,
        bio: providerData.bio,
        skills: providerData.skills || [],
        qualifications: providerData.qualifications || [],
        logoUrl: providerData.logoUrl,
        IDCardUrl: providerData.IDCardUrl || '',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true
          }
        }
      }
    })
  ]);

  return newProvider;
};

export const updateProvider = async (userId: string, providerData: ProviderUpdateData) => {
  // Check if user has a provider profile
  const existingProvider = await prisma.serviceProvider.findUnique({
    where: { userId }
  });

  if (!existingProvider) {
    throw new Error('Service provider profile not found');
  }

  const updatedData: any = {};
  if (providerData.bio !== undefined) updatedData.bio = providerData.bio;
  if (providerData.skills !== undefined) updatedData.skills = providerData.skills;
  if (providerData.qualifications !== undefined) updatedData.qualifications = providerData.qualifications;
  if (providerData.logoUrl !== undefined) updatedData.logoUrl = providerData.logoUrl;
  if (providerData.IDCardUrl !== undefined) updatedData.IDCardUrl = providerData.IDCardUrl;

  const updatedProvider = await prisma.serviceProvider.update({
    where: { userId },
    data: updatedData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true
        }
      },
      services: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isActive: true
        }
      }
    }
  });

  return updatedProvider;
};

export const deleteProvider = async (userId: string) => {
  // Check if user has a provider profile
  const existingProvider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      services: true,
      schedules: { select: { customerConfirmation: true, providerConfirmation: true } },
      payments: true
    }
  });

  if (!existingProvider) {
    throw new Error('Service provider profile not found');
  }

  // Check for active dependencies
  const activeServices = existingProvider.services.filter(service => service.isActive);
  if (activeServices.length > 0) {
    throw new Error('Cannot delete provider with active services. Please deactivate all services first.');
  }

  const pendingSchedules = existingProvider.schedules.filter(schedule => 
    !schedule.customerConfirmation || !schedule.providerConfirmation
  );
  if (pendingSchedules.length > 0) {
    throw new Error('Cannot delete provider with pending schedules.');
  }

  // Delete provider and update user role back to USER
  await prisma.$transaction([
    prisma.serviceProvider.delete({
      where: { userId }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' }
    })
  ]);

  return { message: 'Service provider profile deleted successfully' };
};

export const getProviderProfile = async (userId: string) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          phone: true,
          location: true,
          address: true,
          socialmedia: true,
          createdAt: true,
          isEmailVerified: true
        }
      },
      companies: {
        orderBy: {
          id: 'desc'
        }
      },
      services: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isActive: true,
          tags: true,
          createdAt: true,
          serviceReviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!provider) {
    throw new Error('Service provider profile not found');
  }

  // Calculate review statistics for each service and overall provider stats
  let totalRating = 0;
  let totalReviewCount = 0;

  const servicesWithStats = provider.services.map(service => {
    const reviewCount = service.serviceReviews.length;
    let averageRating = 0;

    if (reviewCount > 0) {
      const serviceTotal = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = serviceTotal / reviewCount;
      totalRating += serviceTotal;
      totalReviewCount += reviewCount;
    }

    const { serviceReviews, ...serviceData } = service;
    return {
      ...serviceData,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
      reviewCount
    };
  });

  // Calculate overall provider statistics
  const overallAverageRating = totalReviewCount > 0 
    ? parseFloat((totalRating / totalReviewCount).toFixed(1)) 
    : 0;

  return {
    ...provider,
    services: servicesWithStats,
    averageRating: overallAverageRating,
    totalReviews: totalReviewCount
  };
};

export const getProviderById = async (id: string) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true
        }
      },
      services: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isActive: true
        }
      }
    }
  });

  if (!provider) {
    throw new Error('Service provider not found');
  }

  return provider;
};

export const getProviderByUserId = async (userId: string) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true
        }
      },
      services: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isActive: true
        }
      }
    }
  });

  if (!provider) {
    throw new Error('Service provider not found');
  }

  return provider;
};

export const verifyProvider = async (providerId: string) => {
  // Check if provider exists
  const existingProvider = await prisma.serviceProvider.findUnique({
    where: { id: providerId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  if (!existingProvider) {
    throw new Error('Service provider not found');
  }

  if (existingProvider.isVerified) {
    throw new Error('Service provider is already verified');
  }

  // Update verification status
  const verifiedProvider = await prisma.serviceProvider.update({
    where: { id: providerId },
    data: { isVerified: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  return verifiedProvider;
};

export const unverifyProvider = async (providerId: string) => {
  // Check if provider exists
  const existingProvider = await prisma.serviceProvider.findUnique({
    where: { id: providerId }
  });

  if (!existingProvider) {
    throw new Error('Service provider not found');
  }

  if (!existingProvider.isVerified) {
    throw new Error('Service provider is already unverified');
  }

  // Update verification status
  const unverifiedProvider = await prisma.serviceProvider.update({
    where: { id: providerId },
    data: { isVerified: false },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  return unverifiedProvider;
};
