import { embeddingService } from './embedding.service.js';
import { queueService } from './queue.service.js';
import { prisma } from '../utils/database.js';

export interface CreateServiceRequestData {
  userId: string;
  title?: string;
  description: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  locationLastUpdated?: Date;
}

export interface UpdateServiceRequestData {
  title?: string;
  description?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface MatchingService {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  providerId: string;
  createdAt: Date;
  similarity: number;
}

// Helper function to generate embeddings for service requests
async function generateServiceRequestEmbeddings(title: string | null | undefined, description: string) {
  try {
    const titleEmb = title ? await embeddingService.generateEmbedding(title) : null;
    const descriptionEmb = await embeddingService.generateEmbedding(description);
    
    // Calculate combined embedding
    let combinedText = '';
    if (title) combinedText += title + ' ';
    combinedText += description;
    
    const combinedEmb = await embeddingService.generateEmbedding(combinedText);
    
    console.log("Embedding sample data:", {
      titleSample: titleEmb ? `Array with ${titleEmb.length} elements` : null,
      descriptionSample: `Array with ${descriptionEmb.length} elements`,
      combinedSample: `Array with ${combinedEmb.length} elements`,
    });
    
    return {
      titleEmbedding: titleEmb,
      descriptionEmbedding: descriptionEmb,
      combinedEmbedding: combinedEmb,
      embeddingUpdatedAt: new Date()
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

export const createServiceRequest = async (data: CreateServiceRequestData) => {
  try {
    // Generate embeddings
    const embeddings = await generateServiceRequestEmbeddings(data.title, data.description);
    
    console.log("Generated embeddings types:", {
      titleEmbedding: embeddings.titleEmbedding ? typeof embeddings.titleEmbedding : null,
      descriptionEmbedding: typeof embeddings.descriptionEmbedding,
      combinedEmbedding: typeof embeddings.combinedEmbedding,
    });
    
    // First create service request without embeddings and without categoryId
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        // categoryId is explicitly set to null
        categoryId: null,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        locationLastUpdated: new Date(),
        embeddingUpdatedAt: embeddings.embeddingUpdatedAt
      }
    });
    
    // Then update the embeddings using raw SQL
    if (serviceRequest.id) {
      try {
        console.log("About to update embeddings with SQL for request:", serviceRequest.id);
        console.log("Embedding samples:", {
          titleLength: embeddings.titleEmbedding ? embeddings.titleEmbedding.length : 0,
          descriptionLength: embeddings.descriptionEmbedding.length,
          combinedLength: embeddings.combinedEmbedding.length
        });
        
        // First try without cast to see if that's the issue
        await prisma.$executeRaw`
          UPDATE "ServiceRequest" 
          SET 
            "titleEmbedding" = ${embeddings.titleEmbedding || null}, 
            "descriptionEmbedding" = ${embeddings.descriptionEmbedding}, 
            "combinedEmbedding" = ${embeddings.combinedEmbedding}
          WHERE "id" = ${serviceRequest.id}
        `;
        
        console.log("Embeddings updated successfully");
      } catch (error) {
        console.error("Error updating embeddings:", error);
        // If the first approach fails, try with a more explicit array format
        try {
          console.log("Trying alternative approach for vector update...");
          
          // Format the vector as a string in PostgreSQL array format
          const titleVectorStr = embeddings.titleEmbedding ? 
            `[${embeddings.titleEmbedding.join(',')}]` : null;
          const descVectorStr = `[${embeddings.descriptionEmbedding.join(',')}]`;
          const combinedVectorStr = `[${embeddings.combinedEmbedding.join(',')}]`;
          
          await prisma.$executeRaw`
            UPDATE "ServiceRequest" 
            SET 
              "titleEmbedding" = ${titleVectorStr ? titleVectorStr : null}::vector(768), 
              "descriptionEmbedding" = ${descVectorStr}::vector(768), 
              "combinedEmbedding" = ${combinedVectorStr}::vector(768)
            WHERE "id" = ${serviceRequest.id}
          `;
          
          console.log("Embeddings updated successfully with alternative approach");
        } catch (secondError) {
          console.error("Second attempt also failed:", secondError);
        }
      }
      
      // Fetch the updated service request
      const updatedServiceRequest = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequest.id }
      });
      
      if (updatedServiceRequest) {
        return updatedServiceRequest;
      }
    }
    
    // If updating embeddings fails, still return the original service request
    return serviceRequest;
  } catch (error) {
    console.error('Error creating service request:', error);
    throw new Error('Failed to create service request');
  }
};

export const getServiceRequests = async (userId: string, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const take = limit;
    
    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where: { userId },
        skip,
        take,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.serviceRequest.count({ where: { userId } })
    ]);
    
    return {
      serviceRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching service requests:', error);
    throw new Error('Failed to fetch service requests');
  }
};

export const getServiceRequestById = async (id: string) => {
  try {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    if (!serviceRequest) {
      throw new Error('Service request not found');
    }
    
    return serviceRequest;
  } catch (error) {
    console.error('Error fetching service request:', error);
    throw new Error('Failed to fetch service request');
  }
};

export const updateServiceRequest = async (id: string, data: UpdateServiceRequestData, userId: string) => {
  try {
    // Verify ownership
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      throw new Error('Service request not found');
    }
    
    if (existingRequest.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own service requests');
    }
    
    // Generate new embeddings if description or title changed
    let embeddings: any = null;
    if (data.description || data.title) {
      const title = data.title ?? existingRequest.title;
      const description = data.description ?? existingRequest.description;
      embeddings = await generateServiceRequestEmbeddings(title, description);
    }
    
    // Update location timestamp if location data changes
    const locationLastUpdated = (data.latitude || data.longitude || data.address || 
                                data.city || data.state || data.country || 
                                data.postalCode) ? new Date() : undefined;
    
    // Update basic fields first
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...data,
        locationLastUpdated,
        embeddingUpdatedAt: embeddings ? embeddings.embeddingUpdatedAt : undefined
      }
    });
    
    // If embeddings were generated, update them using raw SQL
    if (embeddings) {
      await prisma.$executeRaw`
        UPDATE "ServiceRequest" 
        SET 
          "titleEmbedding" = ${embeddings.titleEmbedding ? embeddings.titleEmbedding : null}::vector(768), 
          "descriptionEmbedding" = ${embeddings.descriptionEmbedding}::vector(768), 
          "combinedEmbedding" = ${embeddings.combinedEmbedding}::vector(768)
        WHERE "id" = ${id}
      `;
      
      // Re-fetch the service request to get the updated data
      const refreshedRequest = await prisma.serviceRequest.findUnique({
        where: { id }
      });
      
      if (refreshedRequest) {
        return refreshedRequest;
      }
    }
    
    // Return the updated request if no embeddings were generated
    return updatedRequest;
  } catch (error) {
    console.error('Error updating service request:', error);
    throw new Error('Failed to update service request');
  }
};

export const deleteServiceRequest = async (id: string, userId: string) => {
  try {
    // Verify ownership
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });
    
    if (!existingRequest) {
      throw new Error('Service request not found');
    }
    
    if (existingRequest.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own service requests');
    }
    
    // Delete service request
    await prisma.serviceRequest.delete({
      where: { id }
    });
    
    return { success: true, message: 'Service request deleted successfully' };
  } catch (error) {
    console.error('Error deleting service request:', error);
    throw new Error('Failed to delete service request');
  }
};

// New function to log matching services for newly created service requests
// New function to send notifications to provider of matching services for newly created service requests
export const sendNotificationsToMatchingProviders = async (serviceRequestId: string) => {
  try {
    console.log('='.repeat(80));
    console.log('🎯 AUTOMATIC MATCHING: Finding services for new request');
    console.log('🎯 Function called with ID:', serviceRequestId); // Debug log
    console.log('='.repeat(80));

    // Get the service request details including user info
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!serviceRequest) {
      console.error('❌ Service request not found for automatic matching');
      return;
    }

    console.log('👤 REQUEST DETAILS:');
    console.log(`   Request ID: ${serviceRequest.id}`);
    console.log(`   User ID: ${serviceRequest.userId}`);
    console.log(`   User Email: ${serviceRequest.user?.email || 'N/A'}`);
    console.log(`   User Name: ${serviceRequest.user?.firstName || ''} ${serviceRequest.user?.lastName || ''}`.trim() || 'N/A');
    console.log(`   Title: ${serviceRequest.title || 'Untitled'}`);
    console.log(`   Description: ${serviceRequest.description}`);
    console.log(`   Created: ${serviceRequest.createdAt}`);

    // Call the existing matching logic to get top matches
    const matchesResult = await findMatchingServices(serviceRequestId, 1, 10); // Get top 10 matches

    console.log('\n🔍 MATCHING RESULTS:');
    console.log(`   Total matches found: ${matchesResult.matchingServices.length}`);
    console.log(`   Total available services: ${matchesResult.pagination.total}`);

    if (matchesResult.matchingServices.length > 0) {
      console.log('\n🏆 TOP MATCHES:');
      matchesResult.matchingServices.slice(0, 5).forEach((service, index) => {
        console.log(`   ${index + 1}. "${service.title || 'Untitled'}"`);
        console.log(`       Similarity: ${Math.round((service.similarity as number || 0) * 100)}%`);
        console.log(`       Service ID: ${service.id}`);
        console.log(`       Provider ID: ${service.providerId}`);
        console.log(`       Price: ${service.price} ${service.currency}`);
        if (service.address || service.city || service.state || service.country) {
          const locationParts = [service.address, service.city, service.state, service.country].filter(Boolean);
          console.log(`       Location: ${locationParts.join(', ')}`);
        }
        console.log('');
      });

      if (matchesResult.matchingServices.length > 5) {
        console.log(`   ... and ${matchesResult.matchingServices.length - 5} more matches`);
      }
    } else {
      console.log('   ⚠️ No matching services found');
    }

    // Filter services with >60% match and send notifications
    const highlyMatchingServices = matchesResult.matchingServices.filter(
      service => (service.similarity as number) > 0.6
    );

    console.log(`\n📧 HIGHLY MATCHING SERVICES (>60%): ${highlyMatchingServices.length}`);
    console.log('='.repeat(60));

    if (highlyMatchingServices.length > 0) {
      let notificationsSent = 0;

      for (const service of highlyMatchingServices) {
        try {
          // Get provider information with email
          const providerInfo = await prisma.serviceProvider.findUnique({
            where: { id: service.providerId },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });

          if (!providerInfo?.user?.email) {
            console.log(`⚠️  No email found for provider ${service.providerId}, skipping notification`);
            continue;
          }

          const customerName = `${serviceRequest.user?.firstName || ''} ${serviceRequest.user?.lastName || ''}`.trim() || 'Customer';
          const providerName = `${providerInfo.user.firstName || ''} ${providerInfo.user.lastName || ''}`.trim() || 'Service Provider';
          const matchPercentage = Math.round((service.similarity as number) * 100);

          console.log(`📤 Sending notification to: ${providerInfo.user.email} (${providerName})`);
          console.log(`   Service: "${service.title || 'Untitled'}"`);
          console.log(`   Match: ${matchPercentage}%`);

          // Send notification using queue service (similar to review notifications)
          await queueService.sendMessageOrReviewNotification({
            customerEmail: serviceRequest.user?.email || 'customer@example.com',
            providerEmail: providerInfo.user.email,
            customerName: customerName,
            providerName: providerName,
            message: `A customer has posted a service request that matches your "${service.title || 'Untitled'}" service with ${matchPercentage}% similarity.`,
            reviewData: null, // No review data for service matches
            notificationType: 'MESSAGE', // Using MESSAGE type for service matches in existing infrastructure
            metadata: {
              serviceRequestId: serviceRequestId,
              serviceId: service.id,
              matchPercentage: matchPercentage,
              serviceTitle: service.title,
              customerName: customerName,
              requestTitle: serviceRequest.title || 'Untitled',
              requestDescription: serviceRequest.description.substring(0, 200) + (serviceRequest.description.length > 200 ? '...' : ''),
              customerLocation: serviceRequest.address || serviceRequest.city || serviceRequest.state || serviceRequest.country ?
                [serviceRequest.address, serviceRequest.city, serviceRequest.state, serviceRequest.country].filter(Boolean).join(', ') : null
            }
          });

          notificationsSent++;
          console.log(`✅ Notification sent successfully to ${providerInfo.user.email}`);

          // Add small delay to avoid overwhelming the queue
          if (highlyMatchingServices.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (notificationError) {
          console.error(`❌ Failed to send notification for service ${service.id}:`, notificationError);
          // Continue with other notifications even if one fails
        }
      }

      console.log(`\n✅ NOTIFICATIONS SUMMARY:`);
      console.log(`   Highly matching services found: ${highlyMatchingServices.length}`);
      console.log(`   Notifications sent: ${notificationsSent}`);
      console.log('='.repeat(60));
    } else {
      console.log('   ⚠️ No services matched above 60% threshold');
    }

    console.log('='.repeat(80));
    console.log('✅ AUTOMATIC MATCHING AND NOTIFICATIONS COMPLETED');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in automatic matching for new request:', error);
    console.log('='.repeat(80));
  }
};

// Define an interface that includes the combinedEmbedding field
interface ServiceRequestWithEmbedding {
  id: string;
  userId: string;
  title?: string;
  description: string;
  categoryId?: string;
  combinedEmbedding: any; // Use 'any' to avoid TypeScript errors with the vector type
  // ... other fields
}

export const findMatchingServices = async (serviceRequestId: string, page = 1, limit = 10): Promise<{
  matchingServices: MatchingService[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}> => {
  try {
    console.log(`Finding matches for service request ID: ${serviceRequestId}`);

    // Use findUnique without select to get all fields
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    }) as unknown as ServiceRequestWithEmbedding; // Cast to our interface

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    // Log some debug info about the embedding
    console.log(`Service request found with embedding: ${serviceRequest.combinedEmbedding ?
      `Array with ${serviceRequest.combinedEmbedding.length} elements` : 'No embedding found'}`);

    if (!serviceRequest.combinedEmbedding) {
      console.warn('Warning: No combined embedding found for this service request');

      // If the embedding is missing, try to regenerate it
      try {
        console.log('Attempting to regenerate the missing embedding...');
        const embeddings = await generateServiceRequestEmbeddings(
          serviceRequest.title || null,
          serviceRequest.description
        );

        // Update the embeddings in the database
        await prisma.$executeRaw`
          UPDATE "ServiceRequest"
          SET
            "titleEmbedding" = ${embeddings.titleEmbedding ? embeddings.titleEmbedding : null}::vector(768),
            "descriptionEmbedding" = ${embeddings.descriptionEmbedding}::vector(768),
            "combinedEmbedding" = ${embeddings.combinedEmbedding}::vector(768),
            "embeddingUpdatedAt" = ${embeddings.embeddingUpdatedAt}
          WHERE "id" = ${serviceRequest.id}
        `;

        console.log('Successfully regenerated and updated embeddings');

        // Update the serviceRequest object with the new embedding
        serviceRequest.combinedEmbedding = embeddings.combinedEmbedding;
      } catch (embeddingError) {
        console.error('Failed to regenerate embedding:', embeddingError);
        throw new Error('Could not find or generate embedding for service request');
      }
    }

    // Convert the JavaScript array to PostgreSQL vector format
    const requestEmbeddingVector = `[${serviceRequest.combinedEmbedding.join(',')}]`;

    // Create a raw SQL query using Prisma's $queryRaw to find semantically similar services
    // This query uses the combinedEmbedding and cosine similarity to find matching services
    const skip = (page - 1) * limit;
    
    // SQL query using pgvector's cosine similarity - without conditional categoryId filter
    let matchingServices: MatchingService[];
    let countResult: { total: number }[];
    
    // We need to handle the categoryId filter differently
    if (serviceRequest.categoryId) {
      console.log(`Searching with category filter: ${serviceRequest.categoryId}`);
      try {
        matchingServices = await prisma.$queryRaw`
          SELECT 
            s."id", 
            s."title", 
            s."description", 
            s."price", 
            s."currency",
            s."address",
            s."city",
            s."state",
            s."country",
            s."postalCode",
            s."providerId",
            s."createdAt",
            1 - (s."combinedEmbedding" <=> ${requestEmbeddingVector}::vector) as similarity
          FROM "Service" s
          WHERE s."isActive" = true
          AND s."categoryId" = ${serviceRequest.categoryId}
          ORDER BY similarity DESC
          LIMIT ${limit}
          OFFSET ${skip}
        ` as MatchingService[];
        console.log(`Found ${matchingServices.length} matching services with category filter`);
      } catch (queryError) {
        console.error('Error executing category-filtered query:', queryError);
        throw queryError;
      }
      
      // Count total matching services with category filter
      try {
        countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total
          FROM "Service" s
          WHERE s."isActive" = true
          AND s."categoryId" = ${serviceRequest.categoryId}
        ` as { total: number }[];
        console.log(`Total count with category filter: ${countResult[0]?.total || 0}`);
      } catch (countError) {
        console.error('Error executing category-filtered count query:', countError);
        throw countError;
      }
    } else {
      // No category filter
      console.log('Searching without category filter');
      try {
        matchingServices = await prisma.$queryRaw`
          SELECT 
            s."id", 
            s."title", 
            s."description", 
            s."price", 
            s."currency",
            s."address",
            s."city",
            s."state",
            s."country",
            s."postalCode",
            s."providerId",
            s."createdAt",
            1 - (s."combinedEmbedding" <=> ${requestEmbeddingVector}::vector) as similarity
          FROM "Service" s
          WHERE s."isActive" = true
          ORDER BY similarity DESC
          LIMIT ${limit}
          OFFSET ${skip}
        ` as MatchingService[];
        console.log(`Found ${matchingServices.length} matching services without category filter`);
      } catch (queryError) {
        console.error('Error executing query without category filter:', queryError);
        throw queryError;
      }
      
      // Count total matching services (no category filter)
      try {
        countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total
          FROM "Service" s
          WHERE s."isActive" = true
        ` as { total: number }[];
        console.log(`Total count without category filter: ${countResult[0]?.total || 0}`);
      } catch (countError) {
        console.error('Error executing count query without category filter:', countError);
        throw countError;
      }
    }
    
    const total = Number(countResult[0]?.total || 0);
    
    // Log some info about the returned services
    console.log('Service matching results summary:');
    console.log(`- Total services found: ${total}`);
    console.log(`- Services returned for this page: ${matchingServices.length}`);
    if (matchingServices.length > 0) {
      console.log(`- Top match similarity: ${matchingServices[0]!.similarity}`);
      console.log(`- First match title: ${matchingServices[0]!.title}`);
    }
    
    return {
      matchingServices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error finding matching services:', error);
    throw new Error('Failed to find matching services');
  }
};
